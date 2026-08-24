import { Link } from 'react-router-dom';
import StatusStamp from './StatusStamp';
import AuctionCountdown from './AuctionCountdown';
import { API_ORIGIN } from '../functions/backendUrl';

/**
 * @param {{ auction: object, isFeatured?: boolean }} props
 */
export default function AuctionCard({ auction, isFeatured = false }) {
  const imageSrc = auction.imageUrl ? `${API_ORIGIN}${auction.imageUrl}` : '';
  const creatorName = auction.createdBy?.companyName || auction.createdBy?.name || 'جهة معلنة';

  return (
    <article className={`flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:shadow-md ${isFeatured ? 'border-s-registry-green border-s-[3px] shadow-sm' : 'border-paper/50'}`}>
      {imageSrc ? (
        <img src={imageSrc} alt={auction.title} className="h-48 w-full object-cover bg-paper" onError={(e) => {
          // Fallback if the image URL is broken
          e.target.onerror = null;
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }} />
      ) : null}
      <div className={`flex h-48 w-full items-center justify-center bg-paper/50 text-text-secondary ${imageSrc ? 'hidden' : ''}`} aria-label="لا توجد صورة للمزاد">
        <svg className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-ink"><bdi>{auction.title}</bdi></h2>
          <StatusStamp status={auction.status} />
        </div>
        <p className="line-clamp-3 text-sm leading-7 text-text-secondary">{auction.description}</p>
        <div className="space-y-2 border-s-2 border-registry-green ps-3 text-sm">
          <p className="flex items-center justify-between gap-3">
            <span className="text-text-secondary">السعر الحالي</span>
            <bdi className="tabular-nums font-bold text-ink" dir="ltr">{auction.currentPrice}</bdi>
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-text-secondary">الوقت المتبقي</span>
            <AuctionCountdown endsAt={auction.endsAt} variant="light" />
          </div>
          <p className="flex items-center justify-between gap-3">
            <span className="text-text-secondary">المعلن</span>
            <bdi>{creatorName}</bdi>
          </p>
        </div>
        </div>
        <div className="pt-5 mt-auto">
          <Link
            to={`/auctions/${auction._id}`}
            className="inline-flex w-full items-center justify-center rounded-lg border border-registry-green px-4 py-2.5 text-sm font-bold text-registry-green transition-colors hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green"
          >
            عرض تفاصيل المزاد
          </Link>
        </div>
      </div>
    </article>
  );
}
