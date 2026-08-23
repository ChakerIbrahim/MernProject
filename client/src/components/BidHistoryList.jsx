import { formatCurrency } from "../functions/tenders";

/**
 * Recent bids, newest first (FR-13.3).
 *
 * aria-live="polite" so a bid arriving on a poll is announced rather than
 * silently changing under a screen-reader user.
 *
 * @param {{_id: string, amount: number, createdAt: string, bidder: object}[]} bids
 */
const BidHistoryList = ({ bids }) => {
  if (!bids?.length) {
    return <p className="text-sm text-text-secondary">لا توجد مزايدات بعد.</p>;
  }

  return (
    <ul aria-live="polite" className="flex flex-col gap-2">
      {bids.map((bid) => (
        <li
          key={bid._id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-field border border-border px-3 py-2 text-sm"
        >
          <span className="text-ink">
            <bdi>{bid.bidder?.name ?? "مزايد"}</bdi>
          </span>
          <span className="flex flex-wrap items-center gap-3">
            <bdi className="tabular-nums text-ink" dir="ltr">
              {formatCurrency(bid.amount)}
            </bdi>
            <bdi className="tabular-nums text-xs text-text-secondary" dir="ltr">
              {new Date(bid.createdAt).toLocaleTimeString("ar", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </bdi>
          </span>
        </li>
      ))}
    </ul>
  );
};

export default BidHistoryList;
