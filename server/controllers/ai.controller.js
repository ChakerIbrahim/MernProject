const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const BidProposal = require("../models/bidProposal.model");
const Tender = require("../models/tender.model");
const { UPLOAD_DIR } = require("../config/multer.config");

// C-7 / NFR-M4: this is the ONLY file permitted to import the Gemini SDK.
// Everything else calls analyzeProposalDocument. If a second file imports
// @google/generative-ai, the constraint is broken.

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-flash-latest";
const ANALYSIS_TIMEOUT_MS = 18000;
const MAX_SUMMARY_LENGTH = 2000;

const MIME_BY_EXTENSION = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const CONTRACT_PROMPT = [
  "أنت مساعد قانوني لصياغة مسودات عقود التوريد بالعربية الفصحى.",
  "اكتب مسودة عقد أولية بين الطرفين بناءً على البيانات التالية فقط.",
  "لا تخترع أطرافاً أو بنوداً مالية غير مذكورة. اذكر البنود الأساسية:",
  "الأطراف، موضوع العقد، القيمة، مدة التنفيذ، والالتزامات العامة.",
  "أعد النص فقط، بدون مقدمة وبدون علامات markdown.",
].join("\n");

const PROMPT = [
  "أنت مساعد لتحليل مستندات العروض في منصة مشتريات.",
  "استخرج من المستند المرفق: السعر الإجمالي، وملخصاً قصيراً بالعربية، ودرجة ثقتك.",
  "أجب بكائن JSON فقط، بدون أي نص إضافي وبدون علامات markdown:",
  '{"extractedPrice": <رقم>, "summary": "<ملخص قصير بالعربية>", "confidenceScore": <رقم بين 0 و 100>}',
].join("\n");

/** Guarantees the API key can never appear in a log line. */
const redact = (value) => {
  const key = process.env.GEMINI_API_KEY;
  const text = String(value);
  return key ? text.split(key).join("[redacted]") : text;
};

/**
 * FR-10.4 / NFR-R1 — every failure in this module becomes one 502 carrying a
 * calm Arabic message. 502 rather than 400 tells the client the upstream failed
 * and the manual path should be offered, instead of blaming the user's input.
 */
const ANALYSIS_UNAVAILABLE = "تعذّر تحليل المستند تلقائياً. يمكنك إدخال البيانات يدوياً.";
const CONTRACT_UNAVAILABLE = "تعذّر إنشاء مسودة العقد تلقائياً. يمكنك المتابعة عبر المحادثة أو المحاولة لاحقاً.";

const aiUnavailable = (reason, message = ANALYSIS_UNAVAILABLE) => {
  const err = new Error(message);
  err.status = 502;
  err.expose = true;
  err.aiReason = reason;
  return err;
};

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("gemini call timed out")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/** Models add ``` fences whatever the prompt says. Take the outermost object. */
const extractJson = (raw) => {
  const text = String(raw ?? "").replace(/```(?:json)?/gi, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    // A malformed response is an AI failure, not a crash.
    return null;
  }
};

/** Never trust the model's numbers — check shape and range before storing. */
const validateExtraction = (data) => {
  if (!data || typeof data !== "object") return null;

  const extractedPrice = Number(data.extractedPrice);
  const confidenceScore = Number(data.confidenceScore);
  const summary = typeof data.summary === "string" ? data.summary.trim() : "";

  if (!Number.isFinite(extractedPrice) || extractedPrice < 0) return null;
  if (!Number.isFinite(confidenceScore) || confidenceScore < 0 || confidenceScore > 100) return null;
  if (!summary) return null;

  return {
    extractedPrice,
    summary: summary.slice(0, MAX_SUMMARY_LENGTH),
    confidenceScore: Math.round(confidenceScore),
  };
};

/**
 * Sends a stored proposal document to Gemini and returns validated data.
 * Throws a 502 error on any failure — missing key, unreadable file, timeout,
 * unparseable response, or values outside the permitted range.
 *
 * Never logs the document contents or the API key (AGENTS.md §5).
 *
 * @param {string} storedUrl e.g. "/uploads/1787…-ab.pdf"
 */
const analyzeProposalDocument = async (storedUrl) => {
  if (!process.env.GEMINI_API_KEY) {
    throw aiUnavailable("GEMINI_API_KEY is not configured");
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(String(storedUrl || "")));
  const mimeType = MIME_BY_EXTENSION[path.extname(filePath).toLowerCase()];

  if (!mimeType) throw aiUnavailable("unsupported document type");

  let data;
  try {
    data = fs.readFileSync(filePath).toString("base64");
  } catch {
    throw aiUnavailable("stored document could not be read");
  }

  let raw;
  try {
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
      model: MODEL_NAME,
    });
    const result = await withTimeout(
      model.generateContent([{ inlineData: { mimeType, data } }, PROMPT]),
      ANALYSIS_TIMEOUT_MS
    );
    raw = result.response.text();
  } catch (err) {
    // Re-thrown as our own error so no SDK object — and no key — escapes.
    throw aiUnavailable(redact(err.message).slice(0, 200));
  }

  const extracted = validateExtraction(extractJson(raw));
  if (!extracted) throw aiUnavailable("model returned an unusable payload");

  return extracted;
};

/**
 * POST /api/proposals/:id/analyze — FR-10.1, FR-10.2
 *
 * The submitting organization only. 200 { aiExtractedData } on success,
 * 502 on any AI failure (SRS §4.2).
 */
const analyzeProposal = async (req, res, next) => {
  try {
    const proposal = await BidProposal.findById(req.params.id);

    if (!proposal) {
      const err = new Error("العرض المطلوب غير موجود.");
      err.status = 404;
      err.expose = true;
      return next(err);
    }

    if (String(proposal.submittedBy) !== String(req.user._id)) {
      const err = new Error("forbidden");
      err.status = 403;
      return next(err);
    }

    const aiExtractedData = await analyzeProposalDocument(proposal.documentUrl);

    proposal.aiExtractedData = aiExtractedData;
    await proposal.save();

    res.json({ aiExtractedData });
  } catch (err) {
    if (err.aiReason) {
      // One line, already redacted; never the document, never the key.
      console.warn(`[ai] analysis unavailable — ${err.aiReason}`);
    }
    next(err);
  }
};

/**
 * FR-15.2 — an AI-drafted contract for an accepted proposal.
 *
 * Lives here because C-7 and NFR-M4 allow exactly one module to touch the
 * Gemini SDK. Same discipline as the extraction path: a bounded timeout, no SDK
 * error ever re-thrown, and the key redacted from anything logged.
 *
 * Returns free text rather than JSON — a contract draft is prose, and FR-15.3
 * requires it to be presented as editable and non-binding.
 */
const generateContractDraft = async ({ tender, proposal, ownerName, bidderName }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw aiUnavailable("GEMINI_API_KEY is not configured", CONTRACT_UNAVAILABLE);
  }

  const facts = [
    `الجهة صاحبة العطاء: ${ownerName ?? "غير محدد"}`,
    `الجهة المنفّذة: ${bidderName ?? "غير محدد"}`,
    `عنوان العطاء: ${tender?.title ?? ""}`,
    `وصف العطاء: ${tender?.description ?? ""}`,
    `فئة العطاء: ${tender?.category ?? ""}`,
    `الموعد النهائي للعطاء: ${tender?.deadline ? new Date(tender.deadline).toISOString().slice(0, 10) : ""}`,
    `القيمة المعتمدة للعرض: ${proposal?.finalPrice ?? ""}`,
    proposal?.aiExtractedData?.summary ? `ملخص العرض: ${proposal.aiExtractedData.summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let text;
  try {
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
      model: MODEL_NAME,
    });
    const result = await withTimeout(
      model.generateContent([CONTRACT_PROMPT, facts]),
      ANALYSIS_TIMEOUT_MS
    );
    text = result.response.text();
  } catch (err) {
    throw aiUnavailable(redact(err.message).slice(0, 200), CONTRACT_UNAVAILABLE);
  }

  const draft = String(text ?? "").replace(/```/g, "").trim();
  if (!draft) throw aiUnavailable("model returned an empty draft", CONTRACT_UNAVAILABLE);

  return draft;
};

/**
 * POST /api/proposals/:id/contract-draft — FR-15.2, tender owner only.
 *
 * 502 on any AI failure, so the client shows an Arabic notice and the thread
 * stays usable (the NFR-R1 discipline from Sprint 05).
 */
const requestContractDraft = async (req, res, next) => {
  try {
    const proposal = await BidProposal.findById(req.params.id)
      .populate("submittedBy", "companyName")
      .populate("tender", "title description category deadline createdBy");

    if (!proposal) {
      const err = new Error("العرض المطلوب غير موجود.");
      err.status = 404;
      err.expose = true;
      return next(err);
    }

    // FR-15.2 — the tender owner alone may ask for a draft.
    if (String(proposal.tender?.createdBy) !== String(req.user._id)) {
      const err = new Error("forbidden");
      err.status = 403;
      return next(err);
    }

    // A draft only makes sense once a proposal has been accepted (FR-15.1).
    if (proposal.status !== "accepted") {
      const err = new Error("لا يمكن إنشاء مسودة عقد إلا بعد قبول العرض.");
      err.status = 400;
      err.expose = true;
      return next(err);
    }

    const tenderOwner = await Tender.findById(proposal.tender._id).populate(
      "createdBy",
      "companyName"
    );

    const contractDraft = await generateContractDraft({
      tender: proposal.tender,
      proposal,
      ownerName: tenderOwner?.createdBy?.companyName,
      bidderName: proposal.submittedBy?.companyName,
    });

    proposal.contractDraft = contractDraft;
    await proposal.save();

    res.json({ contractDraft });
  } catch (err) {
    if (err.aiReason) {
      console.warn(`[ai] contract draft unavailable — ${err.aiReason}`);
    }
    next(err);
  }
};

module.exports = {
  analyzeProposal,
  analyzeProposalDocument,
  requestContractDraft,
  generateContractDraft,
};
