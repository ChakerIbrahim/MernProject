const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function safeUnlink(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function parseGeminiJson(rawText) {
    const cleaned = String(rawText || '')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new Error('AI_INVALID_JSON');
        }
        try {
            return JSON.parse(cleaned.slice(start, end + 1));
        } catch (nestedError) {
            throw new Error('AI_INVALID_JSON');
        }
    }
}

function getAiFailureCode(error) {
    const message = String(error?.message || '').toLowerCase();
    const status = Number(error?.status || error?.response?.status || 0);

    if (message === 'ai_timeout') return 'AI_TIMEOUT';
    if (message === 'ai_invalid_json') return 'AI_INVALID_JSON';
    if (message === 'ai_invalid_response') return 'AI_INVALID_RESPONSE';
    if (status === 401 || status === 403 || /api key|permission|unauthori[sz]ed|forbidden/.test(message)) return 'AI_AUTH_ERROR';
    if (status === 404 || /model.*(not found|unavailable)|no longer available/.test(message)) return 'AI_MODEL_UNAVAILABLE';
    if (status === 429 || /quota|rate limit|too many requests/.test(message)) return 'AI_RATE_LIMIT';
    return 'AI_PROVIDER_ERROR';
}

function normalizeConfidenceScore(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    const percentage = number > 0 && number <= 1 ? number * 100 : number;
    return Math.max(0, Math.min(100, percentage));
}

async function analyzeProposalFile(filePath, mimeType, tender) {
    const { fileTypeFromFile } = await import('file-type');
    const detectedType = await fileTypeFromFile(filePath);
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
        throw new Error('FILE_INVALID');
    }

    const priorityFields = Array.isArray(tender.priorityFields) ? tender.priorityFields : [];
    const customFields = Array.isArray(tender.customFields) ? tender.customFields : [];
    const requirements = [
        { key: 'title', label: 'عنوان العطاء', value: tender.title, priority: priorityFields.includes('title') },
        { key: 'description', label: 'وصف العطاء', value: tender.description, priority: priorityFields.includes('description') },
        { key: 'category', label: 'الفئة', value: tender.category, priority: priorityFields.includes('category') },
        { key: 'budgetEstimate', label: 'الميزانية التقديرية', value: tender.budgetEstimate ?? 'غير محدد', priority: priorityFields.includes('budgetEstimate') },
        { key: 'deadline', label: 'الموعد النهائي', value: tender.deadline, priority: priorityFields.includes('deadline') },
        ...customFields.map((field) => ({
            key: field.key,
            label: field.label,
            value: field.value,
            priority: Boolean(field.isPriority)
        }))
    ];

    const prompt = `
أنت مراجع عروض متخصص لمنصة اعتماد الفلسطينية. اقرأ مستند العرض المرفق وقارنه بمتطلبات العطاء التالية. أعد JSON صالحاً فقط دون Markdown.

متطلبات العطاء:
${JSON.stringify(requirements, null, 2)}

الحقول التي حددتها الجهة الطارحة كأولوية يجب أن يكون لها وزن أعلى في التقييم:
${JSON.stringify(requirements.filter((field) => field.priority), null, 2)}

لا تخترع معلومات غير موجودة في مستند العرض. قيّم مدى مطابقة العرض للمتطلبات، وميّز بوضوح بين المعلومات الموجودة والمعلومات غير الموجودة. أعد الشكل التالي:
{
  "extractedPrice": null,
  "summary": "ملخص عربي موجز للعرض",
  "overallScore": 0,
  "confidenceScore": 0,
  "priorityAssessment": [{"key":"مفتاح الحقل","label":"اسم الحقل","score":0,"status":"مطابق|جزئي|غير موجود|غير مطابق","evidence":"دليل موجز من العرض"}],
  "strengths": ["نقطة قوة"],
  "gaps": ["نقص أو مخاطرة"]
}

overallScore و score أرقام من 0 إلى 100. احسب overallScore مع إعطاء الحقول ذات priority=true وزناً أعلى، ولا تعتبر غياب الدليل تطابقاً. confidenceScore هو ثقتك في قراءة مستند العرض، وليس درجة العرض.`;

    const model = genAI.getGenerativeModel({
        model: AI_MODEL,
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8000
        }
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 90000));
    const result = await Promise.race([
        model.generateContent([prompt, { inlineData: { data: Buffer.from(fs.readFileSync(filePath)).toString('base64'), mimeType: detectedType.mime } }]),
        timeoutPromise
    ]);
    const parsed = parseGeminiJson((await result.response).text());
    if (!parsed || !Number.isFinite(Number(parsed.overallScore)) || !Array.isArray(parsed.priorityAssessment)) {
        throw new Error('AI_INVALID_RESPONSE');
    }

    return {
        extractedPrice: parsed.extractedPrice === null || parsed.extractedPrice === undefined ? null : Number(parsed.extractedPrice),
        summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
        overallScore: Math.max(0, Math.min(100, Number(parsed.overallScore))),
        confidenceScore: normalizeConfidenceScore(parsed.confidenceScore),
        priorityAssessment: parsed.priorityAssessment.slice(0, 30),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 10) : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 10) : [],
        analyzedAt: new Date().toISOString()
    };
}




/**
 * Analyzes an uploaded business proposal document to extract price and summary.
 * Expects a file in req.file. Returns JSON with aiExtractedData.
 * Returns 502 if the AI fails, preserving the uploaded file for manual entry.
 */
module.exports.analyzeDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "لم يتم العثور على ملف للتحليل" });
        }

        const filePath = req.file.path;
        let filePart = null;

        const ext = path.extname(filePath).toLowerCase();
        if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
            filePart = {
                inlineData: {
                    data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
                    mimeType: req.file.mimetype
                },
            };
        } else {
            return res.status(400).json({ error: "نوع الملف غير مدعوم للتحليل" });
        }

        const prompt = `
        Analyze this business proposal document.
        Extract the following information and return ONLY a valid JSON object. Do not include markdown formatting, code blocks, or any other text.

        {
            "extractedPrice": <number, the total proposed price or budget. If not found, use null>,
            "summary": "<string, a brief Arabic summary of the proposal's main points>",
            "confidenceScore": <number, 0-100 indicating how confident you are in this extraction>
        }
        `;

        const model = genAI.getGenerativeModel({ model: AI_MODEL });

        const content = [prompt, filePart];

        // Apply timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI_TIMEOUT')), 15000)
        );

        const aiPromise = model.generateContent(content);

        const result = await Promise.race([aiPromise, timeoutPromise]);
        const response = await result.response;
        let text = response.text();

        // Strip markdown fences if present
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            return res.status(502).json({ error: "استجابة غير صالحة من خدمة الذكاء الاصطناعي" });
        }

        // Validate shape
        if (
            (parsed.extractedPrice !== null && typeof parsed.extractedPrice !== 'number') ||
            typeof parsed.confidenceScore !== 'number' ||
            parsed.confidenceScore < 0 || parsed.confidenceScore > 100
        ) {
            return res.status(502).json({ error: "بيانات مستخرجة غير صالحة" });
        }

        res.status(200).json({ aiExtractedData: parsed });

    } catch (err) {
        console.error("AI Analysis error:", err);
        if (err.message === 'AI_TIMEOUT') {
            return res.status(502).json({ error: "انتهى وقت الاتصال بخدمة الذكاء الاصطناعي" });
        }
        res.status(502).json({ error: "تعذّر تحليل المستند تلقائياً، يمكنك إدخال السعر يدوياً", details: err.message });
    } finally {
        // Clean up the temp file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};


/**
 * Analyzes an uploaded National ID image to verify authenticity and extract data.
 * Expects an image/PDF in req.file. Returns JSON with aiVerification data.
 * Deletes the file immediately after processing. Returns 502 on AI failure.
 */
module.exports.analyzeIdDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم إرفاق مستند الهوية' });
        }
        if (req.file.size > 5 * 1024 * 1024) {
            safeUnlink(req.file.path);
            return res.status(400).json({ error: 'حجم مستند الهوية يتجاوز الحد الأقصى (5 ميجابايت)' });
        }
        const { fileTypeFromFile } = await import('file-type');
        const detectedType = await fileTypeFromFile(req.file.path);
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
            safeUnlink(req.file.path);
            return res.status(400).json({ error: 'صيغة مستند الهوية غير مدعومة. ارفع PDF أو JPG أو PNG' });
        }

        const model = genAI.getGenerativeModel({ model: AI_MODEL });
        const fileData = fs.readFileSync(req.file.path);

        const prompt = `أنت نظام تدقيق هويات فلسطينية. قم بقراءة مستند الهوية المرفق واستخرج البيانات التالية بصيغة JSON فقط:
{
  "firstName": "الاسم الأول",
  "lastName": "اسم العائلة",
  "nationalId": "رقم الهوية المكون من 9 أرقام",
  "isValid": true/false (هل تبدو الهوية حقيقية وصالحة؟),
  "confidenceScore": 0.0 to 1.0,
  "notes": "أي ملاحظات على جودة الصورة أو شكوك حول التزوير أو إذا كان المستند ليس هوية"
}
إذا لم يكن المستند هوية وطنية، أو لم يكن واضحاً، اجعل isValid = false واكتب السبب بدقة في notes (مثلاً: "الصورة غير واضحة"، "المستند ليس هوية وطنية"، "الهوية غير مكتملة").`;

        const imagePart = {
            inlineData: {
                data: fileData.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const extractedData = parseGeminiJson(responseText);

        safeUnlink(req.file.path);

        res.status(200).json({ aiVerification: extractedData });
    } catch (err) {
        safeUnlink(req.file?.path);
        const code = getAiFailureCode(err);
        res.status(502).json({ error: 'تعذّر تحليل الهوية تلقائياً', reasonCode: code });
    }
};

/**
 * Analyzes an uploaded official tender book to generate a draft tender form.
 * Expects a file in req.file. Returns JSON with aiDraft, missing fields, and document URL.
 * Returns 502 on AI failure, preserving the file so the user can continue manually.
 */
module.exports.analyzeTenderBook = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ errors: { officialBook: 'الكتاب الرسمي للعطاء مطلوب' } });

        const { fileTypeFromFile } = await import('file-type');
        const detectedType = await fileTypeFromFile(req.file.path);
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
            safeUnlink(req.file.path);
            return res.status(400).json({ errors: { officialBook: 'الملف غير مدعوم، يرجى رفع PDF أو JPG أو PNG' } });
        }

        const documentUrl = `/uploads/${req.file.filename}`;
        const filePart = { inlineData: { data: Buffer.from(fs.readFileSync(req.file.path)).toString('base64'), mimeType: detectedType.mime } };
        const prompt = `
أنت مساعد متخصص في تنظيم العطاءات لمنصة اعتماد الفلسطينية. اقرأ الكتاب الرسمي المرفق واستخرج المعلومات بدقة. لا تخترع أي معلومة غير موجودة. أعد JSON صالحاً فقط دون Markdown.

أولاً، حدد ما إذا كان المستند مرتبطاً بالمشتريات، العطاءات، طلبات عروض الأسعار، أو العقود التجارية. إذا كان المستند غير ذي صلة (مثل قائمة أسماء حيوانات، ألعاب، أو نصوص عشوائية)، اجعل isRelevant: false ولا تستخرج باقي الحقول.

أعد الشكل التالي:
{
  "isRelevant": true,
  "title": "عنوان العطاء أو فارغ إذا لم يوجد",
  "description": "وصف مهني موجز مستند إلى الكتاب",
  "category": "واحدة من: توريدات، خدمات، أشغال عامة، استشارات",
  "budgetEstimate": null,
  "deadline": null,
  "customFields": [{"key":"سلسلة_إنجليزية_قصيرة","label":"اسم الحقل بالعربية","value":"القيمة","type":"text|number|date","required":false,"source":"document"}],
  "missingRequiredFields": ["deadline"],
  "confidenceScore": 0
}

إذا كان isRelevant: true، فالحقول الأساسية المطلوبة للنشر هي: title, description, category, deadline. إذا لم تجد الموعد النهائي، أعد deadline بقيمة null وأضف deadline إلى missingRequiredFields. استخرج الشروط والمتطلبات ومكان التسليم ومدة التنفيذ وطريقة التقديم الموجودة في الكتاب إلى customFields، بحد أقصى 20 حقلاً وبصياغة موجزة. اجعل الوصف مهنياً ومختصراً، وحافظ على الأرقام والتواريخ كما وردت دون تخمين.`;
        const model = genAI.getGenerativeModel({
            model: AI_MODEL,
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                maxOutputTokens: 8000
            }
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 90000));
        const aiPromise = model.generateContent([prompt, filePart]);
        const result = await Promise.race([aiPromise, timeoutPromise]);
        const text = (await result.response).text();
        const parsed = parseGeminiJson(text);

        if (typeof parsed?.isRelevant !== 'boolean') {
            throw new Error('AI_INVALID_RESPONSE');
        }

        if (parsed.isRelevant === false) {
            safeUnlink(req.file.path);
            return res.status(400).json({
                error: 'المستند المرفوع لا يبدو ككتاب عطاء أو طلب عروض أسعار. يرجى رفع وثيقة مشتريات صحيحة.',
                isIrrelevant: true
            });
        }

        const validCategories = ['توريدات', 'خدمات', 'أشغال عامة', 'استشارات'];
        const normalized = {
            title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
            description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
            category: validCategories.includes(parsed.category) ? parsed.category : 'توريدات',
            budgetEstimate: typeof parsed.budgetEstimate === 'number' && parsed.budgetEstimate >= 0 ? parsed.budgetEstimate : null,
            deadline: typeof parsed.deadline === 'string' && parsed.deadline ? parsed.deadline : null,
            customFields: Array.isArray(parsed.customFields) ? parsed.customFields.slice(0, 30) : [],
            missingRequiredFields: Array.isArray(parsed.missingRequiredFields) ? parsed.missingRequiredFields : [],
            confidenceScore: normalizeConfidenceScore(parsed.confidenceScore)
        };
        const standardMissing = [];
        if (!normalized.title) standardMissing.push('title');
        if (!normalized.description) standardMissing.push('description');
        if (!normalized.deadline) standardMissing.push('deadline');
        normalized.missingRequiredFields = [...new Set([...normalized.missingRequiredFields, ...standardMissing])];
        return res.status(200).json({ aiDraft: normalized, officialBookUrl: documentUrl, officialBookName: req.file.originalname, canContinueManually: true });
    } catch (err) {
        const reasonCode = getAiFailureCode(err);
        console.error('Tender book AI analysis failed:', {
            reasonCode,
            model: AI_MODEL,
            providerStatus: Number(err?.status || err?.response?.status || 0) || null,
            hasUploadedFile: Boolean(req.file)
        });
        if (req.file && fs.existsSync(req.file.path) && reasonCode !== 'FILE_INVALID') {
            const documentUrl = `/uploads/${req.file.filename}`;
            const message = reasonCode === 'AI_TIMEOUT'
                ? 'انتهى وقت تحليل الكتاب، يمكنك متابعة الإدخال يدوياً'
                : 'تعذّر تحليل الكتاب تلقائياً، يمكنك متابعة الإدخال يدوياً';
            return res.status(502).json({ error: message, reasonCode, officialBookUrl: documentUrl, officialBookName: req.file.originalname, canContinueManually: true });
        }
        safeUnlink(req.file?.path);
        return res.status(502).json({ error: 'تعذّر تحليل الكتاب تلقائياً', reasonCode });
    }
};

/**
 * Analyzes an uploaded product document to generate dynamic auction properties.
 * Expects a file in req.file. Returns JSON with aiDraft (title, description, itemFields).
 * Returns 502 on AI failure, preserving the file so the user can continue manually.
 */
module.exports.analyzeAuctionItem = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ errors: { officialDocument: 'وثيقة معلومات المنتج مطلوبة' } });

        const { fileTypeFromFile } = await import('file-type');
        const detectedType = await fileTypeFromFile(req.file.path);
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
            safeUnlink(req.file.path);
            return res.status(400).json({ errors: { officialDocument: 'الملف غير مدعوم، يرجى رفع PDF أو JPG أو PNG' } });
        }

        const documentUrl = `/uploads/${req.file.filename}`;
        const filePart = {
            inlineData: {
                data: Buffer.from(fs.readFileSync(req.file.path)).toString('base64'),
                mimeType: detectedType.mime
            }
        };
        const prompt = `
أنت مساعد متخصص في تنظيم بيانات المنتجات المعروضة في مزاد على منصة اعتماد الفلسطينية. اقرأ وثيقة معلومات المنتج المرفقة، وحدد إن كانت تحتوي على معلومات حقيقية عن منتج أو أصل قابل للبيع بالمزاد.

إذا كانت الوثيقة غير مرتبطة بمنتج قابل للمزاد أو تحتوي على نص عشوائي، أعد isRelevant: false. لا تخترع أي معلومات.
إذا كانت مرتبطة، أعد نموذجاً ديناميكياً قابلاً للتعديل باللغة العربية، مع الحقول العامة وخصائص المنتج المهمة فقط. أمثلة: السيارة قد تحتاج الماركة والموديل واللون وسنة الصنع ورقم الهيكل، والكمبيوتر قد يحتاج المعالج وبطاقة الرسوميات والذاكرة والتخزين.

أعد JSON صالحاً فقط بالشكل التالي:
{
  "isRelevant": true,
  "title": "اسم المنتج أو الأصل",
  "description": "وصف مهني موجز مستند إلى الوثيقة",
  "itemFields": [
    {"key":"سلسلة_إنجليزية_قصيرة","label":"اسم الخاصية بالعربية","value":"القيمة كما وردت","type":"text|number|date","required":false,"source":"document"}
  ],
  "confidenceScore": 0
}

أعد من 1 إلى 30 حقلاً فقط. يجب أن تكون confidenceScore بين 0 و100. لا تضف حقولاً بقيم مخمّنة، ويمكنك إضافة حقل مهم بقيمة فارغة فقط إذا كان وجوده ضرورياً لنوع المنتج، وضع required=true عند الحاجة. لا تضع السعر أو موعد انتهاء المزاد ضمن itemFields لأنهما يملآن في نموذج المزاد نفسه.`;

        const model = genAI.getGenerativeModel({
            model: AI_MODEL,
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                maxOutputTokens: 6000
            }
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 90000));
        const result = await Promise.race([
            model.generateContent([prompt, filePart]),
            timeoutPromise
        ]);
        const parsed = parseGeminiJson((await result.response).text());
        if (typeof parsed?.isRelevant !== 'boolean') throw new Error('AI_INVALID_RESPONSE');
        if (parsed.isRelevant === false) {
            safeUnlink(req.file.path);
            return res.status(400).json({
                error: 'المستند المرفوع لا يحتوي على معلومات منتج مناسبة للمزاد. يرجى رفع وثيقة صحيحة.',
                isIrrelevant: true
            });
        }

        const itemFields = Array.isArray(parsed.itemFields) ? parsed.itemFields.slice(0, 30).map((field, index) => ({
            key: String(field?.key || `field_${index + 1}`).trim().slice(0, 80),
            label: String(field?.label || '').trim().slice(0, 120),
            value: String(field?.value || '').trim().slice(0, 1000),
            type: ['text', 'number', 'date'].includes(field?.type) ? field.type : 'text',
            required: Boolean(field?.required),
            source: 'document'
        })).filter((field) => field.label) : [];

        if (!String(parsed.title || '').trim() || !String(parsed.description || '').trim()) {
            throw new Error('AI_INVALID_RESPONSE');
        }

        return res.status(200).json({
            aiDraft: {
                title: String(parsed.title).trim().slice(0, 200),
                description: String(parsed.description).trim().slice(0, 3000),
                itemFields,
                confidenceScore: normalizeConfidenceScore(parsed.confidenceScore)
            },
            officialDocumentUrl: documentUrl,
            officialDocumentName: req.file.originalname,
            canContinueManually: true
        });
    } catch (err) {
        const reasonCode = getAiFailureCode(err);
        console.error('Auction item AI analysis failed:', {
            reasonCode,
            model: AI_MODEL,
            providerStatus: Number(err?.status || err?.response?.status || 0) || null,
            hasUploadedFile: Boolean(req.file)
        });
        if (req.file && fs.existsSync(req.file.path) && reasonCode !== 'FILE_INVALID') {
            return res.status(502).json({
                error: reasonCode === 'AI_TIMEOUT' ? 'انتهى وقت تحليل وثيقة المنتج، يمكنك متابعة الإدخال يدوياً' : 'تعذّر تحليل وثيقة المنتج تلقائياً، يمكنك متابعة الإدخال يدوياً',
                reasonCode,
                officialDocumentUrl: `/uploads/${req.file.filename}`,
                officialDocumentName: req.file.originalname,
                canContinueManually: true
            });
        }
        safeUnlink(req.file?.path);
        return res.status(502).json({ error: 'تعذّر تحليل وثيقة المنتج تلقائياً', reasonCode });
    }
};


/**
 * Analyzes an already-submitted proposal document against its parent tender's requirements.
 * Expects proposalId in req.params. Saves and returns the resulting aiExtractedData.
 * Restricted to the tender owner or an admin. Returns 502 on AI failure.
 */
module.exports.analyzeExistingProposal = async (req, res, next) => {
    try {
        const BidProposal = require('../models/bidProposal.model');
        const proposal = await BidProposal.findById(req.params.proposalId).populate('tender');
        if (!proposal) return res.status(404).json({ error: 'العرض غير موجود' });
        if (!proposal.tender) return res.status(404).json({ error: 'العطاء المرتبط بالعرض غير موجود' });
        if (proposal.tender.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'تحليل العرض متاح لمالك العطاء فقط' });
        }

        const uploadRoot = path.resolve(__dirname, '..');
        const relativeDocumentPath = String(proposal.documentUrl || '').replace(/^\/+/, '');
        const documentPath = path.resolve(uploadRoot, relativeDocumentPath);
        const relativeToUploadRoot = path.relative(uploadRoot, documentPath);
        if (relativeToUploadRoot.startsWith('..') || path.isAbsolute(relativeToUploadRoot) || !fs.existsSync(documentPath)) {
            return res.status(404).json({ error: 'مستند العرض غير موجود' });
        }

        const aiExtractedData = await analyzeProposalFile(documentPath, null, proposal.tender);
        proposal.aiExtractedData = aiExtractedData;
        await proposal.save();
        return res.status(200).json({ aiExtractedData, proposal });
    } catch (err) {
        const reasonCode = getAiFailureCode(err);
        console.error('Existing proposal AI analysis failed:', {
            reasonCode,
            model: AI_MODEL,
            providerStatus: Number(err?.status || err?.response?.status || 0) || null,
            proposalId: req.params.proposalId
        });
        return res.status(reasonCode === 'FILE_INVALID' ? 400 : 502).json({
            error: reasonCode === 'FILE_INVALID' ? 'مستند العرض غير مدعوم' : 'تعذّر تحليل العرض تلقائياً حالياً',
            reasonCode
        });
    }
};
