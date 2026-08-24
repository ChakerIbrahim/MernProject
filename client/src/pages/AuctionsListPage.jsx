/**
 * Public auctions list page.
 * Loads active auctions, supports search, price, image, and sort filters, and paginates the results.
 * Approved organizations and administrators also receive a link to create an auction.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import AuctionCard from '../components/AuctionCard';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../functions/api';
import { useAuth } from '../components/AuthContext';

/** Maximum number of auction cards shown on one page. */
const ITEMS_PER_PAGE = 12;

/**
 * Builds the filtered and paginated auctions page.
 * @returns {JSX.Element} Auction search controls, cards, loading, or error UI.
 */
export default function AuctionsListPage() {
  // Current user used to decide whether creation is allowed.
  const { user } = useAuth();
  // Auctions returned from the server.
  const [auctions, setAuctions] = useState([]);
  // Controls the initial auction-list spinner.
  const [isLoading, setIsLoading] = useState(true);
  // Error shown when auction loading fails.
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('endingSoon');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyWithImages, setOnlyWithImages] = useState(false);

  /**
   * Loads active auctions from the server.
   * @returns {Promise<void>} Updates auction, loading, and error state.
   * @throws {Error} The Axios error is caught and displayed in ErrorState.
   */
  const fetchAuctions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/auctions');
      setAuctions(response.data.auctions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل المزادات النشطة. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const filteredAuctions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('ar');
    const minimum = minPrice === '' ? null : Number(minPrice);
    const maximum = maxPrice === '' ? null : Number(maxPrice);

    return auctions
      .filter((auction) => {
        const searchableText = [
          auction.title,
          auction.description,
          auction.createdBy?.companyName,
          auction.createdBy?.name
        ].filter(Boolean).join(' ').toLocaleLowerCase('ar');
        const price = Number(auction.currentPrice ?? auction.startingPrice ?? 0);

        if (normalizedSearch && !searchableText.includes(normalizedSearch)) return false;
        if (minimum !== null && Number.isFinite(minimum) && price < minimum) return false;
        if (maximum !== null && Number.isFinite(maximum) && price > maximum) return false;
        if (onlyWithImages && !auction.imageUrl) return false;
        return true;
      })
      .sort((first, second) => {
        if (sortBy === 'priceLow') {
          return Number(first.currentPrice ?? first.startingPrice ?? 0) - Number(second.currentPrice ?? second.startingPrice ?? 0);
        }
        if (sortBy === 'priceHigh') {
          return Number(second.currentPrice ?? second.startingPrice ?? 0) - Number(first.currentPrice ?? first.startingPrice ?? 0);
        }
        if (sortBy === 'newest') {
          return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
        }
        return new Date(first.endsAt || 0) - new Date(second.endsAt || 0);
      });
  }, [auctions, maxPrice, minPrice, onlyWithImages, searchTerm, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [maxPrice, minPrice, onlyWithImages, searchTerm, sortBy]);

  // Safe pagination values used by the card grid and pager.
  const totalPages = Math.ceil(filteredAuctions.length / ITEMS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const paginatedAuctions = filteredAuctions.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  // Only administrators and approved organizations may create auctions.
  const canCreateAuction = user?.role === 'admin' || (user?.role === 'organization' && user?.status === 'approved');
  const hasActiveFilters = Boolean(searchTerm || minPrice || maxPrice || onlyWithImages || sortBy !== 'endingSoon');

  /**
   * Resets all search, price, image, and sort controls.
   * @returns {void} Restores the default result view.
   */
  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('endingSoon');
    setMinPrice('');
    setMaxPrice('');
    setOnlyWithImages(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7" dir="rtl">
      <section className="relative overflow-hidden rounded-[24px] border border-border bg-surface px-5 py-7 shadow-sm sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -start-20 -top-24 h-64 w-64 rounded-full bg-registry-green/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -end-16 bottom-[-8rem] h-72 w-72 rounded-full bg-info/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-registry-green/20 bg-registry-green/5 px-3 py-1.5 text-xs font-bold text-registry-green">
              <span className="h-2 w-2 rounded-full bg-registry-green [animation:pulse_2s_ease-in-out_infinite]" aria-hidden="true" />
              مزادات مفتوحة للمشاركة
            </div>
            <PageHeading title="اكتشف المزادات" />
            <p className="mt-3 max-w-xl text-sm leading-8 text-text-secondary">
              ابحث بين المزادات النشطة، قارن الأسعار الحالية، واختر الفرصة الأقرب لاهتماماتك قبل انتهاء الوقت.
            </p>
          </div>
          {canCreateAuction ? (
            <Link to="/auctions/new" className="shrink-0">
              <Button variant="primary" className="w-full justify-center gap-2 sm:w-auto">
                <Icon name="plus" className="h-4 w-4" />
                إنشاء مزاد جديد
              </Button>
            </Link>
          ) : null}
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-text-secondary">المزادات المتاحة</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">{auctions.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary">نتائج البحث</p>
            <p className="mt-1 font-display text-2xl font-bold text-registry-green tabular-nums">{filteredAuctions.length}</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-text-secondary">ترتيب العرض</p>
            <p className="mt-1 text-sm font-bold text-ink">الأقرب انتهاءً أولاً</p>
          </div>
        </div>
      </section>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">تصفية المزادات</h2>
            <p className="mt-1 text-xs text-text-secondary">استخدم الفلاتر للوصول إلى المزاد المناسب بسرعة.</p>
          </div>
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-registry-green transition-colors hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
              <Icon name="refresh" className="h-3.5 w-3.5" />
              مسح الفلاتر
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr)_minmax(170px,1fr)_minmax(170px,1fr)_minmax(180px,1fr)]">
          <label className="flex flex-col gap-2 text-xs font-bold text-ink">
            البحث
            <div className="flex items-center gap-2 rounded-xl border border-border bg-paper px-3.5 py-2.5 transition-colors focus-within:border-registry-green focus-within:ring-1 focus-within:ring-registry-green/20">
              <Icon name="search" className="h-4 w-4 shrink-0 text-text-secondary" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="اسم المزاد أو الجهة المعلنة"
                className="min-w-0 flex-1 bg-transparent text-sm font-normal text-ink outline-none placeholder:text-text-secondary"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-xs font-bold text-ink">
            ترتيب النتائج
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="min-h-[43px] rounded-xl border border-border bg-paper px-3.5 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-registry-green focus:ring-1 focus:ring-registry-green/20">
              <option value="endingSoon">الأقرب انتهاءً</option>
              <option value="newest">الأحدث إضافةً</option>
              <option value="priceLow">السعر الأقل</option>
              <option value="priceHigh">السعر الأعلى</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-2 text-xs font-bold text-ink">
              السعر من
              <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" className="min-h-[43px] w-full rounded-xl border border-border bg-paper px-3.5 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-registry-green focus:ring-1 focus:ring-registry-green/20" dir="ltr" />
            </label>
            <label className="flex flex-col gap-2 text-xs font-bold text-ink">
              السعر إلى
              <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="بدون حد" className="min-h-[43px] w-full rounded-xl border border-border bg-paper px-3.5 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-registry-green focus:ring-1 focus:ring-registry-green/20" dir="ltr" />
            </label>
          </div>

          <label className="flex cursor-pointer items-end gap-3 rounded-xl border border-border bg-paper px-3.5 py-3 transition-colors hover:border-registry-green/50">
            <input type="checkbox" checked={onlyWithImages} onChange={(event) => setOnlyWithImages(event.target.checked)} className="mb-0.5 h-4 w-4 accent-registry-green" />
            <span className="text-sm font-semibold text-ink">المزادات التي تحتوي على صور</span>
          </label>
        </div>
      </Card>

      {isLoading ? (
        <div className="py-12"><Spinner label="جاري تحميل المزادات..." /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAuctions} />
      ) : paginatedAuctions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-12 text-center shadow-sm">
          <EmptyState message={hasActiveFilters ? 'لا توجد مزادات تطابق الفلاتر الحالية.' : 'لا توجد مزادات نشطة حالياً.'} />
          {hasActiveFilters ? <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">عرض كل المزادات</button> : null}
        </div>
      ) : (
        <section aria-labelledby="auction-results-title" className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="auction-results-title" className="font-display text-xl font-bold text-ink">المزادات المتاحة</h2>
              <p className="mt-1 text-sm text-text-secondary">تظهر {paginatedAuctions.length} من أصل {filteredAuctions.length} مزاداً.</p>
            </div>
            <span className="hidden rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary sm:inline-flex">مرتبة حسب الأقرب انتهاءً</span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedAuctions.map((auction) => <AuctionCard key={auction._id} auction={auction} />)}
          </div>
          {totalPages > 1 ? (
            <div className="flex justify-center pt-2">
              <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
