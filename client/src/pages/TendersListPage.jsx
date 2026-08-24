/**
 * Public tenders list page.
 * Loads open tenders, applies URL-based category and budget filters, and paginates the result.
 * Filter values stay in the URL so the same view can be restored after refresh or sharing.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../functions/api';
import PageHeading from '../components/PageHeading';
import TenderCard from '../components/TenderCard';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';

/** Maximum number of tender cards shown on one page. */
const ITEMS_PER_PAGE = 9;

/**
 * Builds the filtered and paginated public tenders page.
 * @returns {JSX.Element} Loading, error, empty, or tender-list UI.
 */
export default function TendersListPage() {
    // Tender records returned by the server.
    const [tenders, setTenders] = useState([]);
    // Controls the list spinner.
    const [isLoading, setIsLoading] = useState(true);
    // Error shown when the tender request fails.
    const [error, setError] = useState("");

    const [searchParams, setSearchParams] = useSearchParams();

    // Read state from URL (preserves exact view on refresh)
    const categoryFilter = searchParams.get('category') || '';
    const minBudgetFilter = searchParams.get('minBudget') || '';
    const maxBudgetFilter = searchParams.get('maxBudget') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const [draftMinBudget, setDraftMinBudget] = useState(minBudgetFilter);
    const [draftMaxBudget, setDraftMaxBudget] = useState(maxBudgetFilter);

    const hasActiveFilters = categoryFilter || minBudgetFilter || maxBudgetFilter;

    /**
     * Loads tenders using the filters stored in the URL.
     * @returns {Promise<void>} Updates tenders, loading, and error state.
     * @throws {Error} The Axios error is caught and shown in ErrorState.
     */
    const fetchTenders = async () => {
        setIsLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.append('category', categoryFilter);
            if (minBudgetFilter) params.append('minBudget', minBudgetFilter);
            if (maxBudgetFilter) params.append('maxBudget', maxBudgetFilter);

            const res = await api.get(`/api/tenders?${params.toString()}`);
            setTenders(res.data.tenders || []);
        } catch (err) {
            setError(err.response?.data?.error || "تعذّر تحميل العطاءات. حاول مرة أخرى.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenders();
    }, [categoryFilter, minBudgetFilter, maxBudgetFilter]);

    useEffect(() => {
        setDraftMinBudget(minBudgetFilter);
        setDraftMaxBudget(maxBudgetFilter);
    }, [minBudgetFilter, maxBudgetFilter]);

    useEffect(() => {
        if (draftMinBudget === minBudgetFilter && draftMaxBudget === maxBudgetFilter) return undefined;
        const timer = window.setTimeout(() => {
            const newParams = new URLSearchParams(searchParams);
            if (draftMinBudget) newParams.set('minBudget', draftMinBudget);
            else newParams.delete('minBudget');
            if (draftMaxBudget) newParams.set('maxBudget', draftMaxBudget);
            else newParams.delete('maxBudget');
            newParams.set('page', '1');
            setSearchParams(newParams);
        }, 400);
        return () => window.clearTimeout(timer);
    }, [draftMinBudget, draftMaxBudget, minBudgetFilter, maxBudgetFilter, searchParams, setSearchParams]);

    /**
     * Updates one filter and resets pagination to the first page.
     * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - Filter event.
     * @returns {void} Updates draft state or URL search parameters.
     */
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'minBudget') {
            setDraftMinBudget(value);
            return;
        }
        if (name === 'maxBudget') {
            setDraftMaxBudget(value);
            return;
        }

        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set(name, value);
        else newParams.delete(name);
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    /**
     * Removes all active filters and returns to the first page.
     * @returns {void} Clears draft values and URL parameters.
     */
    const clearFilters = () => {
        setDraftMinBudget('');
        setDraftMaxBudget('');
        setSearchParams(new URLSearchParams());
    };

    /**
     * Changes the page number and moves the viewport to the list top.
     * @param {number} newPage - Page number selected by the user.
     * @returns {void} Updates the URL and scroll position.
     */
    const handlePageChange = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
        // Scroll to top of list smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Client-side pagination logic
    // Values used to safely display only the requested page of results.
    const totalPages = Math.ceil(tenders.length / ITEMS_PER_PAGE);
    const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const paginatedTenders = tenders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // The filter UI content, extracted so it can be passed as children to FilterBar
    const filterContent = (
        <div className="flex flex-col lg:flex-row gap-4 items-end w-full bg-surface p-4 rounded-xl border border-border shadow-sm mb-6">
            <div className="flex-1 w-full">
                <label htmlFor="category" className="block text-[13px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">الفئة</label>
                <select
                    id="category"
                    name="category"
                    value={categoryFilter}
                    onChange={handleFilterChange}
                    className="w-full border border-border rounded-lg p-2.5 bg-paper text-[14px] font-medium text-ink focus:outline-none focus:ring-1 focus:ring-registry-green transition-shadow"
                >
                    <option value="">الكل</option>
                    <option value="توريدات">توريدات</option>
                    <option value="خدمات">خدمات</option>
                    <option value="أشغال عامة">أشغال عامة</option>
                    <option value="استشارات">استشارات</option>
                </select>
            </div>
            <div className="flex-1 w-full">
                <label htmlFor="minBudget" className="block text-[13px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">الحد الأدنى للميزانية</label>
                <input
                    id="minBudget"
                    name="minBudget"
                    type="number"
                    min="0"
                    value={draftMinBudget}
                    onChange={handleFilterChange}
                    dir="ltr"
                    className="w-full border border-border rounded-lg p-2.5 bg-paper text-[14px] font-medium text-ink focus:outline-none focus:ring-1 focus:ring-registry-green text-start tabular-nums transition-shadow"
                    placeholder="0"
                />
            </div>
            <div className="flex-1 w-full">
                <label htmlFor="maxBudget" className="block text-[13px] font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">الحد الأقصى للميزانية</label>
                <input
                    id="maxBudget"
                    name="maxBudget"
                    type="number"
                    min="0"
                    value={draftMaxBudget}
                    onChange={handleFilterChange}
                    dir="ltr"
                    className="w-full border border-border rounded-lg p-2.5 bg-paper text-[14px] font-medium text-ink focus:outline-none focus:ring-1 focus:ring-registry-green text-start tabular-nums transition-shadow"
                    placeholder="لا حدود"
                />
            </div>
            <div className="w-full lg:w-auto lg:shrink-0 pt-2 lg:pt-0">
                <Button variant="secondary" onClick={clearFilters} className="w-full lg:w-auto justify-center h-11 bg-transparent border-border hover:bg-paper" disabled={!hasActiveFilters}>
                    مسح الفلاتر
                </Button>
            </div>
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-[1280px]">
            <nav className="mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[14px] text-text-secondary" aria-label="مسار التنقل">
                <a href="/" className="transition-colors hover:text-registry-green">الرئيسية</a>
                <span className="text-[#D1D5DB]" aria-hidden="true">‹</span>
                <span className="font-medium text-ink">المنافسات</span>
            </nav>

            <div className="mb-6 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-[26px] font-bold leading-[1.3] text-ink sm:text-[30px]">المنافسات</h1>
                    <div className="mt-0.5 text-[14px] text-text-secondary">استعرض جميع المنافسات المتاحة والمفتوحة لتقديم العروض</div>
                </div>
                <div className="mt-3 flex shrink-0 items-center gap-2.5 sm:mt-0">
                    <Button variant="primary" className="h-[42px] px-5 text-[14px]">بحث متقدم</Button>
                    <Button variant="secondary" className="h-[42px] border-ink/15 px-5 text-[14px] bg-transparent hover:bg-ink/5">تصدير</Button>
                </div>
            </div>

            {filterContent}

            <div className="mt-2">
                {isLoading ? (
                    <div className="py-12"><Spinner label="جاري تحميل العطاءات..." /></div>
                ) : error ? (
                    <ErrorState message={error} onRetry={fetchTenders} />
                ) : tenders.length === 0 ? (
                    <EmptyState
                        message={hasActiveFilters
                            ? "لا توجد عطاءات تطابق الفلاتر المحددة"
                            : "لا توجد عطاءات مفتوحة حالياً"
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-5">
                            {paginatedTenders.map((tender) => (
                                <TenderCard key={tender._id} tender={tender} />
                            ))}
                        </div>

                        <div className="mt-9 flex flex-wrap items-center justify-center gap-1.5">
                            <Pagination
                                currentPage={safePage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
