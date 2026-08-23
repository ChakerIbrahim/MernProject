/** Mirrors the enum in server/models/auction.model.js; the schema is the authority. */
export const AUCTION_STATUSES = ["pending_approval", "active", "ended", "cancelled"];

/**
 * Splits a millisecond span into whole units for the countdown.
 * Never returns a negative span — a finished auction reads as ended, not as a
 * negative number.
 */
export const breakDownRemaining = (ms) => {
  const total = Math.max(0, ms);
  return {
    isOver: total <= 0,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
};

/** Milliseconds until `endsAt`, floored at zero. */
export const remainingFrom = (endsAt) =>
  endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : 0;

/** FR-14.4 — the four outcomes, each with its own Arabic label. */
export const OUTCOME_LABELS = {
  winning: "أنت الأعلى حالياً",
  outbid: "تم تجاوز مزايدتك",
  won: "فزت بالمزاد",
  lost: "لم تفز بالمزاد",
};

export const OUTCOME_TONES = {
  winning: "border-registry-green text-registry-green",
  outbid: "border-warning text-warning",
  won: "border-registry-green text-registry-green",
  lost: "border-border text-text-secondary",
};

/** NFR-P2 — between 3 and 5 seconds. Faster hammers the server. */
export const POLL_INTERVAL_MS = 4000;
