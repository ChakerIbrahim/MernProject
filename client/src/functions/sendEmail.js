import emailjs from "@emailjs/browser";

/**
 * The ONLY file permitted to import @emailjs/browser (C-8, NFR-M4).
 * Every notification in the product goes through sendNotification.
 *
 * EmailJS is not a security boundary and not a source of truth. The database
 * already holds the state change by the time anything here runs.
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/** True only when all three values are configured (NFR-S4: they live in .env). */
export const isEmailConfigured = () =>
  Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * Fire-and-forget. Never throws, never retries, never reverses anything.
 *
 * The swallow is the requirement, not laziness: FR-16.3 and NFR-R2 say a failed
 * email must not block, retry indefinitely, or undo the state change that
 * triggered it. If an approval succeeded and the email failed, the organization
 * is still approved.
 *
 * @param {object} params template variables (to_email, to_name, subject, message)
 * @param {string} [templateId]
 * @returns {Promise<boolean>} whether it was sent — for logging only
 */
export const sendNotification = async (params, templateId = TEMPLATE_ID) => {
  if (!isEmailConfigured()) {
    // Not an error: the MVP is usable without EmailJS configured at all.
    console.info("[email] skipped — EmailJS is not configured in this environment");
    return false;
  }

  try {
    await emailjs.send(SERVICE_ID, templateId, params, PUBLIC_KEY);
    return true;
  } catch (err) {
    // Logged client-side and dropped, per FR-16.3.
    console.error("[email] EmailJS failed:", err?.text ?? err?.message ?? err);
    return false;
  }
};

// --- the five triggers (FR-16.1) -------------------------------------------
// Each builds its own Arabic body. Callers pass the record the server already
// returned, so nothing here re-derives state.

/** Trigger 1 — organization approved (FR-4.4, from Sprint 02). */
export const notifyOrganizationApproved = (organization) =>
  sendNotification({
    to_email: organization.email,
    to_name: organization.companyName ?? organization.name ?? "",
    subject: "تم اعتماد حساب مؤسستكم",
    message:
      `تم اعتماد حساب مؤسسة ${organization.companyName ?? ""} على منصة المشتريات والمزادات. ` +
      "يمكنكم الآن نشر العطاءات وتقديم العروض وطرح المزادات.",
  });

/** Trigger 2 — organization rejected (FR-4.4). */
export const notifyOrganizationRejected = (organization, reason) =>
  sendNotification({
    to_email: organization.email,
    to_name: organization.companyName ?? organization.name ?? "",
    subject: "بخصوص طلب تسجيل مؤسستكم",
    message:
      `لم تتم الموافقة على طلب تسجيل مؤسسة ${organization.companyName ?? ""}.` +
      (reason ? ` السبب: ${reason}` : "") +
      " يمكنكم مراجعة البيانات والتواصل مع إدارة المنصة.",
  });

/** Trigger 3 — proposal accepted (FR-11.3, from Sprint 05). */
export const notifyProposalAccepted = (proposal, tenderTitle) =>
  sendNotification({
    to_email: proposal.submittedBy?.email,
    to_name: proposal.submittedBy?.companyName ?? "",
    subject: "تم قبول عرضكم",
    message:
      `تم قبول العرض المقدَّم من مؤسستكم على العطاء "${tenderTitle ?? ""}". ` +
      "سيتم التواصل معكم لاستكمال الإجراءات.",
  });

/** Trigger 4 — proposal rejected (FR-11.3). */
export const notifyProposalRejected = (proposal, tenderTitle) =>
  sendNotification({
    to_email: proposal.submittedBy?.email,
    to_name: proposal.submittedBy?.companyName ?? "",
    subject: "بخصوص العرض المقدَّم",
    message:
      `لم يتم قبول العرض المقدَّم من مؤسستكم على العطاء "${tenderTitle ?? ""}". ` +
      "نشكر لكم مشاركتكم ونتطلع لعروضكم القادمة.",
  });

/** Trigger 5 — auction won (FR-14.3, from Sprint 07). */
export const notifyAuctionWon = (auction, winner) =>
  sendNotification({
    to_email: winner?.email,
    to_name: winner?.name ?? "",
    subject: "تهانينا، لقد فزت بالمزاد",
    message:
      `لقد فزت بمزاد "${auction.title}" بمبلغ ${auction.currentPrice}. ` +
      "يمكنك متابعة إجراءات الدفع من صفحة مزاداتي.",
  });
