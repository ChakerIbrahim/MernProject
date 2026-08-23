const Tender = require("../models/tender.model");
const { TENDER_STATUSES } = require("../models/tender.model");

// Fields a client may set. Anything else in the body is ignored — createdBy
// and status in particular are derived, never accepted.
const WRITABLE_FIELDS = ["title", "description", "category", "budgetEstimate", "deadline"];

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
};

const pickWritable = (body) => {
  const update = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) update[field] = body[field];
  }
  return update;
};

/** POST /api/tenders — FR-6.1, FR-6.2 */
const createTender = async (req, res, next) => {
  try {
    const tender = new Tender({
      ...pickWritable(req.body),
      // FR-5.4: the owner is the authenticated caller, never a body value.
      createdBy: req.user._id,
      // FR-6.2: always open on creation.
      status: "open",
    });

    await tender.save();
    res.json({ tender });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tenders — FR-7.1, FR-7.2
 *
 * Every filter is added only when the caller supplied it. Assigning an
 * undefined value would put an `undefined` key into the query and silently
 * match nothing.
 */
const listTenders = async (req, res, next) => {
  try {
    const { category, minBudget, maxBudget, status, mine } = req.query;
    const filter = {};

    // "mine" backs the organization dashboard's own-tenders list, which needs
    // closed and cancelled rows too. Everyone else sees open tenders (FR-7.1).
    if (mine === "true") {
      filter.createdBy = req.user._id;
    } else {
      filter.status = "open";
    }

    if (status && TENDER_STATUSES.includes(status)) filter.status = status;
    if (category) filter.category = category;

    const min = Number(minBudget);
    const max = Number(maxBudget);
    if (minBudget !== undefined && minBudget !== "" && Number.isFinite(min)) {
      filter.budgetEstimate = { ...filter.budgetEstimate, $gte: min };
    }
    if (maxBudget !== undefined && maxBudget !== "" && Number.isFinite(max)) {
      filter.budgetEstimate = { ...filter.budgetEstimate, $lte: max };
    }

    const tenders = await Tender.find(filter)
      .populate("createdBy", "companyName")
      .sort({ createdAt: -1 });

    res.json({ tenders });
  } catch (err) {
    next(err);
  }
};

/** GET /api/tenders/:id — FR-7.3 */
const getTenderById = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id).populate(
      "createdBy",
      "companyName"
    );

    if (!tender) return next(httpError(404, "العطاء المطلوب غير موجود."));

    res.json({ tender });
  } catch (err) {
    // A malformed id is a CastError, which the global middleware maps to 404.
    next(err);
  }
};

/**
 * GET /api/admin/tenders — admin oversight view of every tender, regardless
 * of status (open, closed, cancelled). GET /api/tenders only shows open
 * tenders publicly, or the caller's own via ?mine=true — neither gives an
 * admin visibility into the full platform history.
 */
const listAllTendersForAdmin = async (req, res, next) => {
  try {
    const tenders = await Tender.find({})
      .populate("createdBy", "companyName")
      .sort({ createdAt: -1 });

    res.json({ tenders });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tenders/:id — FR-8.1
 *
 * isOwnerOrAdmin has already loaded the tender onto req.resource and refused
 * anyone who is not the owner. Editing is allowed only while the tender is
 * still open.
 */
const updateTender = async (req, res, next) => {
  try {
    const tender = req.resource;

    if (tender.status !== "open") {
      return next(httpError(400, "لا يمكن تعديل عطاء مغلق أو ملغى."));
    }

    Object.assign(tender, pickWritable(req.body));

    // save() runs the schema validators, including the future-date rule, so a
    // deadline cannot be edited into the past.
    await tender.save();

    res.json({ tender });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tenders/:id — FR-8.2, FR-8.3
 *
 * A soft close: the SRS has no hard-delete requirement, and §5.2 keeps
 * `closed` and `cancelled` as states. The owner or an admin may act; an admin
 * may do so on any tender, to moderate policy violations.
 */
const closeTender = async (req, res, next) => {
  try {
    const tender = req.resource;

    if (tender.status !== "open") {
      return next(httpError(400, "العطاء مغلق أو ملغى مسبقاً."));
    }

    const requested = req.body?.status;
    tender.status = requested === "cancelled" ? "cancelled" : "closed";
    await tender.save();

    res.json({
      message: tender.status === "cancelled" ? "تم إلغاء العطاء." : "تم إغلاق العطاء.",
      tender,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTender,
  listTenders,
  getTenderById,
  updateTender,
  closeTender,
  listAllTendersForAdmin,
};
