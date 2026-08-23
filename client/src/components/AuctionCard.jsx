import { Link } from "react-router-dom";
import AuctionCountdown from "./AuctionCountdown";
import StatusStamp from "./StatusStamp";
import { fileUrl } from "../functions/api";
import { formatCurrency } from "../functions/tenders";

/**
 * One auction in a grid.
 *
 * The image is optional (SRS §5.4). With none, a token-coloured block stands in
 * — never a broken image icon.
 *
 * @param {object} auction
 * @param {React.ReactNode} [actions]
 */
const AuctionCard = ({ auction, actions }) => (
  <article className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
    {auction.imageUrl ? (
      <img
        src={fileUrl(auction.imageUrl)}
        alt={`صورة ${auction.title}`}
        className="h-40 w-full object-cover"
      />
    ) : (
      <div
        aria-hidden="true"
        className="flex h-40 w-full items-center justify-center border-b border-border bg-paper"
      >
        <span className="text-sm text-text-secondary">لا توجد صورة</span>
      </div>
    )}

    <div className="flex flex-1 flex-col p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-lg text-ink">
          <Link
            to={`/auctions/${auction._id}`}
            className="hover:text-registry-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green"
          >
            <bdi>{auction.title}</bdi>
          </Link>
        </h3>
        <StatusStamp entity="auction" status={auction.status} />
      </div>

      <dl className="mb-4 border-s-2 border-border ps-4 text-sm">
        <div className="mb-2 flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">السعر الحالي:</dt>
          <dd>
            <bdi className="font-display tabular-nums text-ink" dir="ltr">
              {formatCurrency(auction.currentPrice)}
            </bdi>
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">الوقت المتبقي:</dt>
          <dd>
            <AuctionCountdown endsAt={auction.endsAt} />
          </dd>
        </div>
      </dl>

      {actions ? <div className="mt-auto flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  </article>
);

export default AuctionCard;
