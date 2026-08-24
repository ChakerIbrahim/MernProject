/**
 * Organization tender workspace.
 * Shows tenders published by the organization and proposals submitted to other tenders.
 * The two views use the shared Axios client and keep their own data in simple page state.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import api from '../functions/api';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusStamp from '../components/StatusStamp';
import { formatMoney, getStatusLabel, formatDate } from '../functions/formatters';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';

/**
 * Builds the organization tender and proposal workspace.
 * @returns {JSX.Element} The tabbed list of published tenders or submitted proposals.
 */
export default function OrgTendersPage() {
  // Signed-in organization used to load its own workspace data.
  const { user } = useAuth();
  // Which tab is visible: published tenders or submitted bids.
  const [activeView, setActiveView] = useState('published');
  // Tenders published by the current organization.
  const [tenders, setTenders] = useState([]);
  // Proposals submitted by the current organization.
  const [bids, setBids] = useState([]);
  // Loading flag for the workspace requests.
  const [isLoading, setIsLoading] = useState(true);
  // User-facing request error.
  const [error, setError] = useState('');

  /**
   * Loads the organization's tenders and submitted proposals.
   * @returns {Promise<void>} Updates list, loading, and error state.
   * @throws {Error} The Axios error is caught and displayed in ErrorState.
   */
  const fetchWorkspace = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [tendersResponse, bidsResponse] = await Promise.all([
        api.get(`/api/tenders?ownerId=${user.id}`),
        api.get('/api/users/me/proposals')
      ]);
      setTenders(tendersResponse.data.tenders || []);
      setBids(bidsResponse.data.proposals || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل عطاءات المؤسسة وعروضها. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchWorkspace();
  }, [user?.id]);

  // The array currently represented by the selected tab.
  const activeItems = activeView === 'published' ? tenders : bids;
  // Counts displayed in the header and tab labels.
  const publishedCount = tenders.length;
  const bidsCount = bids.length;
  const activeCount = activeItems.length;

  // Small preview lists used by the quick-summary row.
  const latestPublished = useMemo(() => tenders.slice(0, 3), [tenders]);
  const latestBids = useMemo(() => bids.slice(0, 3), [bids]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-5 py-7 shadow-sm sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -start-20 -top-24 h-64 w-64 rounded-full bg-registry-green/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -end-16 bottom-[-8rem] h-72 w-72 rounded-full bg-info/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-registry-green/20 bg-registry-green/5 px-3 py-1.5 text-xs font-bold text-registry-green">
              <Icon name="document" className="h-3.5 w-3.5" />
              مساحة المؤسسة
            </div>
            <PageHeading title="عطاءاتي" />
            <p className="mt-3 max-w-2xl text-sm leading-8 text-text-secondary">تابع العطاءات التي نشرتها المؤسسة والعروض التي قدمتها للجهات الأخرى من مساحة واحدة.</p>
          </div>
          <Link to="/tenders/new" className="shrink-0">
            <Button variant="primary" className="w-full justify-center gap-2 sm:w-auto"><Icon name="plus" className="h-4 w-4" /> طرح عطاء جديد</Button>
          </Link>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <div><p className="text-xs font-semibold text-text-secondary">عطاءاتي المنشورة</p><p className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">{publishedCount}</p></div>
          <div><p className="text-xs font-semibold text-text-secondary">العروض المقدمة</p><p className="mt-1 font-display text-2xl font-bold text-registry-green tabular-nums">{bidsCount}</p></div>
          <div className="hidden sm:block"><p className="text-xs font-semibold text-text-secondary">المعروض الآن</p><p className="mt-1 text-sm font-bold text-ink">{activeView === 'published' ? 'عطاءات المؤسسة' : 'عروض المؤسسة'}</p></div>
        </div>
      </section>

      <section aria-label="التبديل بين العطاءات والعروض" className="rounded-2xl border border-border bg-surface p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" role="tab" aria-selected={activeView === 'published'} onClick={() => setActiveView('published')} className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all focus-visible:outline-1 focus-visible:outline-registry-green ${activeView === 'published' ? 'bg-registry-green text-surface shadow-sm' : 'text-text-secondary hover:bg-paper hover:text-ink'}`}>
            <Icon name="building" className="h-5 w-5" />
            عطاءاتي المنشورة <span className="rounded-full bg-surface/20 px-2 py-0.5 text-xs tabular-nums">{publishedCount}</span>
          </button>
          <button type="button" role="tab" aria-selected={activeView === 'bids'} onClick={() => setActiveView('bids')} className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all focus-visible:outline-1 focus-visible:outline-registry-green ${activeView === 'bids' ? 'bg-registry-green text-surface shadow-sm' : 'text-text-secondary hover:bg-paper hover:text-ink'}`}>
            <Icon name="arrow" className="h-5 w-5" />
            العروض التي قدمتها <span className="rounded-full bg-surface/20 px-2 py-0.5 text-xs tabular-nums">{bidsCount}</span>
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="py-12"><Spinner label="جاري تحميل بيانات المؤسسة..." /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchWorkspace} />
      ) : (
        <section role="tabpanel" aria-label={activeView === 'published' ? 'عطاءات المؤسسة المنشورة' : 'العروض التي قدمتها المؤسسة'} className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{activeView === 'published' ? 'العطاءات التي نشرتها' : 'العروض التي قدمتها'}</h2>
              <p className="mt-1 text-sm text-text-secondary">{activeCount ? `لديك ${activeCount} عنصر${activeCount === 1 ? '' : 'اً'} في هذه القائمة.` : 'ستظهر بياناتك هنا عند توفرها.'}</p>
            </div>
            <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary">آخر التحديثات</span>
          </div>

          {activeCount === 0 ? (
            <Card className="p-8"><EmptyState message={activeView === 'published' ? 'لا توجد عطاءات نشرتها المؤسسة بعد.' : 'لم تقدم المؤسسة أي عروض على عطاءات خارجية بعد.'} actionLabel={activeView === 'published' ? 'طرح عطاء جديد' : 'استعراض المنافسات'} onAction={() => window.location.assign(activeView === 'published' ? '/tenders/new' : '/tenders')} /></Card>
          ) : activeView === 'published' ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tenders.map((tender, index) => (
                <Card key={tender._id} className="group flex h-full flex-col justify-between overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:border-registry-green/40 hover:shadow-md">
                  <div className="p-5">
                    <div className="mb-4 flex items-start justify-between gap-3"><span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-bold text-text-secondary">عطاء {String(index + 1).padStart(2, '0')}</span><StatusStamp status={tender.status} label={getStatusLabel(tender.status)} /></div>
                    <Link to={`/tenders/${tender._id}`} className="line-clamp-2 font-display text-lg font-bold leading-8 text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green"><bdi>{tender.title}</bdi></Link>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-text-secondary">{tender.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-paper/50 px-5 py-4"><span className="text-xs text-text-secondary">{formatDate(tender.createdAt)}</span><Link to={`/tenders/${tender._id}`} className="text-sm font-bold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">عرض التفاصيل</Link></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {bids.map((bid) => (
                <Card key={bid._id} className="flex flex-col justify-between gap-5 p-5 transition-all hover:border-registry-green/40 hover:shadow-md sm:flex-row sm:items-center sm:p-6">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3"><Link to={`/tenders/${bid.tender?._id}`} className="line-clamp-2 font-display text-lg font-bold text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green"><bdi>{bid.tender?.title || 'عطاء غير متوفر'}</bdi></Link><StatusStamp status={bid.status} label={getStatusLabel(bid.status)} /></div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary"><span>الجهة الطارحة: <bdi className="font-semibold text-ink">{bid.tender?.createdBy?.companyName || bid.tender?.createdBy?.name || 'غير متوفر'}</bdi></span><span>السعر: <bdi dir="ltr" className="font-bold text-ink tabular-nums">{formatMoney(bid.finalPrice)}</bdi></span></div>
                  </div>
                  <Link to={`/proposals/${bid._id}`} className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-ink hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green"><Icon name="arrow" className="h-4 w-4" /> تفاصيل العرض</Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {!isLoading && !error && activeCount > 0 ? <div className="grid gap-4 md:grid-cols-3"><Card className="p-5"><p className="text-xs font-semibold text-text-secondary">آخر ما نشرته</p><p className="mt-2 line-clamp-2 text-sm font-bold text-ink">{latestPublished[0]?.title || 'لا يوجد عطاء منشور'}</p></Card><Card className="p-5"><p className="text-xs font-semibold text-text-secondary">آخر عرض قدمته</p><p className="mt-2 line-clamp-2 text-sm font-bold text-ink">{latestBids[0]?.tender?.title || 'لا يوجد عرض مقدم'}</p></Card><Card className="p-5"><p className="text-xs font-semibold text-text-secondary">اختصار سريع</p><Link to={activeView === 'published' ? '/tenders/new' : '/tenders'} className="mt-2 inline-flex text-sm font-bold text-registry-green hover:underline">{activeView === 'published' ? 'نشر عطاء جديد ←' : 'تصفح عطاءات جديدة ←'}</Link></Card></div> : null}
    </div>
  );
}
