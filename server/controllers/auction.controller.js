const Auction = require("../models/auction.model");
const BidHistory = require("../models/bidHistory.model");
const { resolveAuctionState } = require("../config/auctionState");
const { discardUploadedFile } = require("../config/multer.config");

const BID_TOO_LOW = "يجب أن تكون مزايدتك أعلى من السعر الحالي.";
const RECENT_BIDS = 10;

// Only these may come from the caller. `status`, `currentPrice`,
// `currentHighestBidder` and `createdBy` are all derived — accepting `status`
// from the body would let a lister approve its own auction (FR-12.2).
const WRITABLE_FIELDS = ["title", "description", "startingPrice", "endsAt"];

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
};

/** FR-12.5 — how long is left, computed from endsAt, never cached at listing time. */
const withTimeRemaining = (auction) => {
  const json = auction.toJSON ? auction.toJSON() : auction;
  return {
    ...json,
    timeRemainingMs: Math.max(0, new Date(json.endsAt).getTime() - Date.now()),
  };
};

const pickWritable = (body) => {
  const values = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) values[field] = body[field];
  }
  return values;
};

/** POST /api/auctions — FR-12.1, FR-12.2 */
const createAuction = async (req, res, next) => {
  try {
    const auction = new Auction({
      ...pickWritable(req.body),
      createdBy: req.user._id,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      // FR-12.2 — always pending, whoever the lister is. An admin gets no
      // self-approval shortcut.
      status: "pending_approval",
    });

    try {
      await auction.validate();
    } catch (schemaError) {
      discardUploadedFile(req.file);
      const errors = {};
      for (const field of Object.keys(schemaError.errors || {})) {
        errors[field] = schemaError.errors[field].message;
      }
      const err = new Error("validation failed");
      err.status = 400;
      err.errors = errors;
      return next(err);
    }

    await auction.save();
    res.json({ auction: withTimeRemaining(auction) });
  } catch (err) {
    discardUploadedFile(req.file);
    next(err);
  }
};

/**
 * GET /api/auctions — FR-12.4, public, no token required.
 *
 * The filter is applied here, in the database query, not on the client: a
 * pending_approval auction must never reach the response body at all, since
 * anyone can read this endpoint (FR-12.2).
 */
const listActiveAuctions = async (req, res, next) => {
  try {
    // ?mine=true backs the organization dashboard's own-listings view. It moved
    // here in Sprint 07 because /api/users/me/auctions had to take on its
    // SRS §4.2 meaning — the individual's bidding history (FR-14.4). Same
    // pattern as GET /api/tenders?mine=true from Sprint 03.
    if (req.query.mine === "true") {
      if (!req.user) {
        const err = new Error("unauthenticated");
        err.status = 401;
        return next(err);
      }

      const owned = await Auction.find({ createdBy: req.user._id })
        .populate("createdBy", "companyName name")
        .sort({ createdAt: -1 });

      for (const auction of owned) await resolveAuctionState(auction);
      return res.json({ auctions: owned.map(withTimeRemaining) });
    }

    // FR-14.1 — anything already past its deadline is resolved on this read,
    // then excluded, so the public list never shows a finished auction.
    const candidates = await Auction.find({ status: "active" })
      .populate("createdBy", "companyName name")
      .sort({ endsAt: 1 });

    const live = [];
    for (const auction of candidates) {
      await resolveAuctionState(auction);
      if (auction.status === "active") live.push(auction);
    }

    res.json({ auctions: live.map(withTimeRemaining) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auctions/:id — public.
 *
 * A pending auction is a 404 to the world; its creator and an admin may see it.
 * 404 rather than 403, so the endpoint does not confirm that a hidden listing
 * exists.
 */
const getAuctionById = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id).populate(
      "createdBy",
      "companyName name"
    );

    if (!auction) return next(httpError(404, "المزاد المطلوب غير موجود."));

    if (auction.status === "pending_approval") {
      const caller = req.user;
      const isCreator = caller && String(auction.createdBy?._id) === String(caller._id);
      const isAdmin = caller?.role === "admin";
      if (!isCreator && !isAdmin) {
        return next(httpError(404, "المزاد المطلوب غير موجود."));
      }
    }

    // FR-14.1 — a finished auction reads as ended from here on.
    await resolveAuctionState(auction);

    // Polled every 4s per viewer, so keep it lean: the most recent handful of
    // bids and only the fields the UI renders.
    const bids = await BidHistory.find({ auction: auction._id })
      .populate("bidder", "name")
      .sort({ createdAt: -1 })
      .limit(RECENT_BIDS)
      .select("amount createdAt bidder");

    res.json({ auction: withTimeRemaining(auction), bids });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auctions/:id/bid — FR-13
 *
 * The check is a single conditional update, not read-then-write: two people
 * bidding the same amount at the same instant would both pass a naive
 * comparison, and only the database can arbitrate that. A null result means
 * someone got there first, or the auction is no longer open.
 */
const placeBid = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);

    const auction = await Auction.findById(req.params.id);
    if (!auction) return next(httpError(404, "المزاد المطلوب غير موجود."));

    await resolveAuctionState(auction);

    if (auction.status !== "active") {
      return next(httpError(400, "هذا المزاد غير متاح للمزايدة."));
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      const err = new Error("validation failed");
      err.status = 400;
      err.errors = { amount: "يرجى إدخال قيمة مزايدة صحيحة." };
      return next(err);
    }

    // FR-13.2 — strictly greater. $lt on currentPrice is what enforces it.
    const updated = await Auction.findOneAndUpdate(
      {
        _id: auction._id,
        status: "active",
        endsAt: { $gt: new Date() },
        currentPrice: { $lt: amount },
      },
      { $set: { currentPrice: amount, currentHighestBidder: req.user._id } },
      { new: true }
    ).populate("createdBy", "companyName name");

    if (!updated) return next(httpError(400, BID_TOO_LOW));

    // FR-13.3 — written only after the update succeeded, or history fills with
    // bids that never took effect.
    await BidHistory.create({
      auction: auction._id,
      bidder: req.user._id,
      amount,
    });

    res.json({ auction: withTimeRemaining(updated) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/me/auctions — FR-14.4
 *
 * The auctions this individual has bid on, each with their own highest bid and
 * an outcome. This is the SRS §4.2 meaning of the path; Sprint 06 used it for
 * an organization's own listings, which moved to GET /api/auctions?mine=true.
 */
const listMyBidAuctions = async (req, res, next) => {
  try {
    const grouped = await BidHistory.aggregate([
      { $match: { bidder: req.user._id } },
      {
        $group: {
          _id: "$auction",
          myHighestBid: { $max: "$amount" },
          lastBidAt: { $max: "$createdAt" },
        },
      },
      { $sort: { lastBidAt: -1 } },
    ]);

    const auctions = [];
    for (const entry of grouped) {
      const auction = await Auction.findById(entry._id).populate(
        "createdBy",
        "companyName name"
      );
      if (!auction) continue;

      // FR-14.1 again — the outcome must reflect a deadline that has passed,
      // even though nothing scheduled ran.
      await resolveAuctionState(auction);

      const isHighest =
        String(auction.currentHighestBidder || "") === String(req.user._id);
      const isFinished = auction.status === "ended";

      const outcome = isFinished
        ? isHighest
          ? "won"
          : "lost"
        : isHighest
          ? "winning"
          : "outbid";

      auctions.push({
        ...withTimeRemaining(auction),
        myHighestBid: entry.myHighestBid,
        lastBidAt: entry.lastBidAt,
        outcome,
      });
    }

    res.json({ auctions });
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/auctions/pending — admin review queue. */
const listPendingAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({ status: "pending_approval" })
      .populate("createdBy", "companyName name")
      .sort({ createdAt: 1 });

    res.json({ auctions: auctions.map(withTimeRemaining) });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/auctions/:id/approve — FR-12.3 */
const approveAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return next(httpError(404, "المزاد المطلوب غير موجود."));

    if (auction.status !== "pending_approval") {
      return next(httpError(400, "تمت معالجة هذا المزاد مسبقاً."));
    }

    auction.status = "active";
    await auction.save();

    res.json({ auction: withTimeRemaining(auction) });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/auctions/:id/reject */
const rejectAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return next(httpError(404, "المزاد المطلوب غير موجود."));

    if (auction.status !== "pending_approval") {
      return next(httpError(400, "تمت معالجة هذا المزاد مسبقاً."));
    }

    auction.status = "cancelled";
    await auction.save();

    res.json({ auction: withTimeRemaining(auction) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAuction,
  listActiveAuctions,
  getAuctionById,
  placeBid,
  listMyBidAuctions,
  listPendingAuctions,
  approveAuction,
  rejectAuction,
};
