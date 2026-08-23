const Auction = require("../models/auction.model");

/**
 * FR-14.1 — lazy closing. There is no cron job and no scheduler: an auction
 * whose endsAt has passed is treated as closed on the next request that reads
 * it. Both read paths call this, so the rule lives in one place.
 *
 * FR-14.2 — the winner is whoever holds currentHighestBidder at that moment,
 * which may legitimately be nobody. NFR-R3 is why this is computed from endsAt
 * and stored bid data rather than a value cached at listing time.
 *
 * The update is atomic and deliberately avoids document.save(): saving would
 * run the schema's future-date validator against an endsAt that is, by
 * definition, now in the past. It also means two concurrent readers cannot
 * both close the same auction.
 *
 * @param {import("mongoose").Document} auction
 * @returns {Promise<import("mongoose").Document>} the same document, updated
 */
const resolveAuctionState = async (auction) => {
  if (!auction || auction.status !== "active") return auction;
  if (new Date(auction.endsAt).getTime() > Date.now()) return auction;

  await Auction.updateOne(
    { _id: auction._id, status: "active" },
    { $set: { status: "ended" } }
  );

  auction.status = "ended";
  return auction;
};

module.exports = { resolveAuctionState };
