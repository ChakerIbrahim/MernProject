const Tender = require('../models/tender.model');

/**
 * Creates a new procurement tender.
 * Validates manual fields, custom AI fields, and priority selections.
 * Returns the created tender object.
 */
module.exports.createTender = async (req, res, next) => {
    try {
        const { title, description, category, budgetEstimate, deadline, officialBookUrl, officialBookName } = req.body;
        const allowedPriorityFields = ['title', 'description', 'category', 'budgetEstimate', 'deadline'];
        let priorityFields = [];
        try {
            priorityFields = req.body.priorityFields ? JSON.parse(req.body.priorityFields) : [];
        } catch (parseError) {
            return res.status(400).json({ errors: { priorityFields: 'بيانات الأولويات غير صالحة' } });
        }
        priorityFields = Array.isArray(priorityFields) ? [...new Set(priorityFields.filter((field) => allowedPriorityFields.includes(field)))] : [];
        if (!officialBookUrl) {
            return res.status(400).json({ errors: { officialBook: 'الكتاب الرسمي للعطاء مطلوب' } });
        }

        let customFields = [];
        let aiExtraction;
        try {
            customFields = req.body.customFields ? JSON.parse(req.body.customFields) : [];
            aiExtraction = req.body.aiExtraction ? JSON.parse(req.body.aiExtraction) : undefined;
        } catch (parseError) {
            return res.status(400).json({ errors: { customFields: 'بيانات الحقول المخصصة غير صالحة' } });
        }

        if (!title || title.trim().length < 3) return res.status(400).json({ errors: { title: 'عنوان العطاء مطلوب ويجب ألا يقل عن 3 أحرف' } });
        if (!description || description.trim().length < 10) return res.status(400).json({ errors: { description: 'وصف العطاء مطلوب ويجب أن يكون واضحاً' } });
        if (!category) return res.status(400).json({ errors: { category: 'الفئة مطلوبة' } });
        if (!deadline) return res.status(400).json({ errors: { deadline: 'الموعد النهائي مطلوب' } });

        const safeCustomFields = Array.isArray(customFields) ? customFields.slice(0, 30).map((field) => ({
            key: String(field.key || '').trim().slice(0, 80),
            label: String(field.label || '').trim().slice(0, 160),
            value: String(field.value ?? '').trim().slice(0, 2000),
            type: ['text', 'number', 'date'].includes(field.type) ? field.type : 'text',
            required: Boolean(field.required),
            source: field.source === 'document' ? 'document' : 'manual',
            isPriority: Boolean(field.isPriority)
        })).filter((field) => field.key && field.label) : [];

        const tender = await Tender.create({
            title: title.trim(),
            description: description.trim(),
            category,
            budgetEstimate: budgetEstimate === '' || budgetEstimate === undefined ? undefined : Number(budgetEstimate),
            deadline,
            officialBookUrl,
            officialBookName,
            customFields: safeCustomFields,
            priorityFields,
            aiExtraction,
            createdBy: req.user.id,
            status: 'open'
        });
        res.status(201).json({ tender });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves a list of tenders, optionally filtered by category, budget, or owner.
 * By default, returns only 'open' tenders unless querying for a specific owner.
 * Returns a JSON object containing the tenders array.
 */
module.exports.listTenders = async (req, res, next) => {
    try {
        const { category, minBudget, maxBudget, ownerId } = req.query;

        // Build filter conditionally
        const filter = {};

        if (ownerId) {
            filter.createdBy = ownerId;
        } else {
            filter.status = 'open';
        }

        if (category) {
            filter.category = category;
        }

        if (minBudget !== undefined || maxBudget !== undefined) {
            filter.budgetEstimate = {};
            if (minBudget !== undefined) filter.budgetEstimate.$gte = Number(minBudget);
            if (maxBudget !== undefined) filter.budgetEstimate.$lte = Number(maxBudget);
        }

        const tenders = await Tender.find(filter).populate('createdBy', 'companyName').sort({ createdAt: -1 });
        res.status(200).json({ tenders });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves a single tender by its ID, populating the creator's company name.
 * Returns the tender object or 404 if not found.
 */
module.exports.getTenderById = async (req, res, next) => {
    try {
        const tender = await Tender.findById(req.params.id).populate('createdBy', 'companyName');
        if (!tender) {
            return res.status(404).json({ error: "العطاء غير موجود" });
        }
        res.status(200).json({ tender });
    } catch (err) {
        next(err);
    }
};

/**
 * Updates an open tender's fields.
 * Prevents overriding ownership or status.
 * Returns the updated tender object.
 */
module.exports.updateTender = async (req, res, next) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ error: "العطاء غير موجود" });
        }

        if (tender.status !== 'open') {
            return res.status(400).json({ error: "لا يمكن تعديل عطاء مغلق أو ملغى" });
        }

        // Prevent overriding ownership
        delete req.body.createdBy;
        delete req.body.status;

        // Apply updates
        Object.assign(tender, req.body);

        // Validate and save
        await tender.save(); // save() runs validators, including our custom deadline validator

        res.status(200).json({ tender });
    } catch (err) {
        next(err);
    }
};

/**
 * Changes a tender's status to 'closed'.
 * Skips full validation to allow closing expired tenders.
 * Returns the updated tender object.
 */
module.exports.closeTender = async (req, res, next) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ error: "العطاء غير موجود" });
        }

        tender.status = 'closed';
        await tender.save({ validateModifiedOnly: true });

        res.status(200).json({ tender });
    } catch (err) {
        next(err);
    }
};
