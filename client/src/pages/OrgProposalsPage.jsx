/**
 * Organization auctions page.
 * Shows auctions created by the organization and auctions in which it participated.
 * A tab switch changes which list is displayed while both lists come from Axios requests.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import api from '../functions/api';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusStamp from '../components/StatusStamp';
import { formatMoney, getStatusLabel } from '../functions/formatters';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { API_ORIGIN } from '../functions/backendUrl';

const outcomeLabels = {
  winning: 'أعلى مزايدة حالياً',
  outbid: 'تم تجاوز مزايدتك',
  won: 'فزت بالمزاد',
  lost: 'لم تفز بالمزاد'
};

/**
 * Displays an auction image or a gavel placeholder when no image exists.
 * @param {object} auction - Auction record containing the image URL and title.
 * @param {boolean} [compact] - Uses the smaller list size when true.
 * @returns {JSX.Element} An image or fallback placeholder.
 */
function AuctionImage({ auction, compact = false }) {
  const source = auction.imageUrl ? `${API_ORIGIN}${auction.imageUrl}` : '';
  if (!source) {
    return <div className={`${compact ? 'h-24 w-24' : 'h-48 w-full'} flex shrink-0 items-center justify-center rounded-xl bg-paper text-text-secondary`}><Icon name="gavel" className="h-8 w-8 opacity-40" /></div>;
  }
  return <img src={source} alt={auction.title} className={`${compact ? 'h-24 w-24' : 'h-48 w-full'} shrink-0 rounded-xl object-cover`} />;
}

/**
 * Builds the organization auctions page.
 * It loads created and participated auctions, then returns tabs, counts, and auction lists.
 * @returns {JSX.Element} The organization auction workspace.
 */
export default function OrgProposalsPage() {
  // The authenticated organization used to decide when data may be loaded.
  const { user } = useAuth();
  // Which auction list is currently visible.
  const [activeTab, setActiveTab] = useState('created');
  // Auctions created by the current organization.
  const [createdAuctions, setCreatedAuctions] = useState([]);
  // Auctions in which the current organization placed a bid.
  const [participatedAuctions, setParticipatedAuctions] = useState([]);
  // Loading flag for both list requests.
  const [isLoading, setIsLoading] = useState(true);
  // Error message shown when either request fails.
  const [error, setError] = useState('');

  /**
   * Loads both auction lists in parallel and stores their results.
   * @returns {Promise<void>} Resolves when loading finishes.
   * @throws {Error} The Axios error is caught and stored in error state.
   */
  const fetchAuctions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [createdResponse, participatedResponse] = await Promise.all([
        api.get('/api/users/me/created-auctions'),
        api.get('/api/users/me/auctions')
      ]);
      setCreatedAuctions(createdResponse.data.auctions || []);
      setParticipatedAuctions(participatedResponse.data.auctions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل مزادات المؤسسة. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAuctions();
  }, [user?.id]);

  // The list displayed by the selected tab.
  const auctions = activeTab === 'created' ? createdAuctions : participatedAuctions;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-5 py-7 shadow-sm sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -start-20 -top-24 h-64 w-64 rounded-full bg-registry-green/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -end-16 bottom-[-8rem] h-72 w-72 rounded-full bg-info/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-registry-green/20 bg-registry-green/5 px-3 py-1.5 text-xs font-bold text-registry-green"><Icon name="gavel" className="h-3.5 w-3.5" /> مساحة المزادات</div>
            <PageHeading title="مزاداتي" />
            <p className="mt-3 max-w-2xl text-sm leading-8 text-text-secondary">تابع المزادات التي أنشأتها المؤسسة والمزادات التي شاركت فيها من مكان واحد.</p>
          </div>
          <Link to="/auctions/new" className="shrink-0"><Button variant="primary" className="w-full justify-center gap-2 sm:w-auto"><Icon name="plus" className="h-4 w-4" /> إنشاء مزاد جديد</Button></Link>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <div><p className="text-xs font-semibold text-text-secondary">مزادات أنشأتها</p><p className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">{createdAuctions.length}</p></div>
          <div><p className="text-xs font-semibold text-text-secondary">مزادات شاركت فيها</p><p className="mt-1 font-display text-2xl font-bold text-registry-green tabular-nums">{participatedAuctions.length}</p></div>
          <div className="hidden sm:block"><p className="text-xs font-semibold text-text-secondary">المعروض الآن</p><p className="mt-1 text-sm font-bold text-ink">{activeTab === 'created' ? 'مزادات المؤسسة' : 'سجل مشاركاتك'}</p></div>
        </div>
      </section>

      <section role="tablist" aria-label="مزادات المؤسسة" className="rounded-2xl border border-border bg-surface p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" role="tab" aria-selected={activeTab === 'created'} onClick={() => setActiveTab('created')} className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all focus-visible:outline-1 focus-visible:outline-registry-green ${activeTab === 'created' ? 'bg-registry-green text-surface shadow-sm' : 'text-text-secondary hover:bg-paper hover:text-ink'}`}><Icon name="building" className="h-5 w-5" /> المزادات التي أنشأتها <span className="rounded-full bg-surface/20 px-2 py-0.5 text-xs tabular-nums">{createdAuctions.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === 'participated'} onClick={() => setActiveTab('participated')} className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all focus-visible:outline-1 focus-visible:outline-registry-green ${activeTab === 'participated' ? 'bg-registry-green text-surface shadow-sm' : 'text-text-secondary hover:bg-paper hover:text-ink'}`}><Icon name="arrow" className="h-5 w-5" /> المزادات التي شاركت فيها <span className="rounded-full bg-surface/20 px-2 py-0.5 text-xs tabular-nums">{participatedAuctions.length}</span></button>
        </div>
      </section>

      {isLoading ? <div className="py-12"><Spinner label="جاري تحميل مزادات المؤسسة..." /></div> : error ? <ErrorState message={error} onRetry={fetchAuctions} /> : (
        <section role="tabpanel" aria-label={activeTab === 'created' ? 'المزادات التي أنشأتها' : 'المزادات التي شاركت فيها'} className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-xl font-bold text-ink">{activeTab === 'created' ? 'المزادات التي أنشأتها' : 'المزادات التي شاركت فيها'}</h2><p className="mt-1 text-sm text-text-secondary">{auctions.length ? `تم العثور على ${auctions.length} مزاد${auctions.length === 1 ? '' : 'اً'}.` : 'ستظهر سجلاتك هنا عند توفرها.'}</p></div><Link to="/auctions" className="text-sm font-bold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">استعراض المزادات المفتوحة ←</Link></div>

          {auctions.length === 0 ? <Card className="p-8"><EmptyState message={activeTab === 'created' ? 'لم تنشئ المؤسسة أي مزادات بعد.' : 'لم تسجل المؤسسة مشاركة في أي مزاد بعد.'} actionLabel={activeTab === 'created' ? 'إنشاء مزاد جديد' : 'استعراض المزادات'} onAction={() => window.location.assign(activeTab === 'created' ? '/auctions/new' : '/auctions')} /></Card> : activeTab === 'created' ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                              {auctions.map((auction, index) => <Card key={auction._id} className="group flex h-full flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:border-registry-green/40 hover:shadow-md"><div className="p-4"><AuctionImage auction={auction} /><div className="mt-4 flex items-center justify-between gap-3"><span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-bold text-text-secondary">مزاد {String(index + 1).padStart(2, '0')}</span><StatusStamp status={auction.status} label={getStatusLabel(auction.status)} /></div><Link to={`/auctions/${auction._id}`} className="mt-3 line-clamp-2 block font-display text-lg font-bold leading-8 text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green"><bdi>{auction.title}</bdi></Link><p className="mt-2 line-clamp-2 text-sm leading-7 text-text-secondary">{auction.description}</p></div><div className="mt-auto flex items-center justify-between border-t border-border bg-paper/50 px-5 py-4"><span className="text-xs text-text-secondary">السعر الحالي: <bdi dir="ltr" className="font-bold text-ink tabular-nums">{formatMoney(auction.currentPrice ?? auction.startingPrice)}</bdi></span><Link to={`/auctions/${auction._id}`} className="text-sm font-bold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">التفاصيل</Link></div></Card>)}
            </div>
          ) : (
            <div className="grid gap-4">{auctions.map((auction) => <Card key={auction._id} className="flex flex-col gap-5 p-5 transition-all hover:border-registry-green/40 hover:shadow-md sm:flex-row sm:items-center sm:p-6"><AuctionImage auction={auction} compact /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><Link to={`/auctions/${auction._id}`} className="line-clamp-2 font-display text-lg font-bold text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green"><bdi>{auction.title}</bdi></Link><StatusStamp status={auction.status} label={getStatusLabel(auction.status)} /></div><div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary"><span>أعلى مزايدة لك: <bdi dir="ltr" className="font-bold text-ink tabular-nums">{formatMoney(auction.highestBid)}</bdi></span><span>السعر الحالي: <bdi dir="ltr" className="font-bold text-ink tabular-nums">{formatMoney(auction.currentPrice)}</bdi></span><span className="font-semibold text-registry-green">{outcomeLabels[auction.outcome] || 'مشاركة مسجلة'}</span></div></div><Link to={`/auctions/${auction._id}`} className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-ink hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green"><Icon name="arrow" className="h-4 w-4" /> تفاصيل المزاد</Link></Card>)}</div>
          )}
        </section>
      )}
    </div>
  );
}
