/**
 * Auction details page.
 * Shows the item, images, description, bid history, timer, and role-specific controls.
 * It refreshes auction data while active and lets eligible users submit bids through Axios.
 */
import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import StatusStamp from '../components/StatusStamp';
import { getStatusLabel, formatDate, formatMoney } from '../functions/formatters';
import AuctionCountdown from '../components/AuctionCountdown';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import Button from '../components/Button';
import Card from '../components/Card';
import Icon from '../components/Icon';
import api from '../functions/api';
import { API_ORIGIN } from '../functions/backendUrl';

/**
 * Builds the auction details and bidding page.
 * @returns {JSX.Element} Loading, error, auction details, history, and bid controls.
 */
export default function AuctionDetailPage() {
  // Auction ID read from the route.
  const { id } = useParams();
  // Current user used for winner and role checks.
  const { user } = useAuth();
  // Auction data returned by the server.
  const [auction, setAuction] = useState(null);
  // Controls the first loading state.
  const [isLoading, setIsLoading] = useState(true);
  // Loading or refresh error message.
  const [error, setError] = useState('');

  // Bid form state: amount, validation error, and submit loading flag.
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Polling & UI state
  const [pricePulse, setPricePulse] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  /**
   * Loads the auction and updates the live price display.
   * @param {boolean} showLoading - Whether to show the full loading state.
   * @returns {Promise<object|null>} The loaded auction, or null after failure.
   * @throws {Error} The Axios error is caught and stored in error state.
   */
  const fetchAuction = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get(`/api/auctions/${id}`);
      const nextAuction = response.data.auction;

      setAuction((current) => {
        if (current && current.currentPrice !== nextAuction.currentPrice) {
          setPricePulse(true);
          setTimeout(() => setPricePulse(false), 1200);
        }
        return nextAuction;
      });
      setError('');
      return nextAuction;
    } catch (err) {
      const message = err.response?.data?.error || 'تعذّر تحميل تفاصيل المزاد. حاول مرة أخرى.';
      if (showLoading || !auction) setError(message);
      return null;
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollingId;

    const poll = async () => {
      const nextAuction = await fetchAuction(false);
      if (isMounted && nextAuction?.status === 'ended' && pollingId) {
        window.clearInterval(pollingId);
      }
    };

    const start = async () => {
      const firstAuction = await fetchAuction(true);
      if (isMounted && firstAuction?.status !== 'ended') {
        pollingId = window.setInterval(poll, 4000);
      }
    };

    start();
    return () => {
      isMounted = false;
      if (pollingId) window.clearInterval(pollingId);
    };
  }, [id]);

  /**
   * Sends one bid amount and refreshes the auction after success.
   * @param {number|string} amount - Amount the user wants to bid.
   * @returns {Promise<void>} Resolves after the bid or error state is updated.
   * @throws {Error} The Axios error is caught and displayed near the bid form.
   */
  const handleBidSubmit = async (amount) => {
    setBidError('');
    setIsSubmitting(true);
    try {
      await api.post(`/api/auctions/${id}/bid`, { amount: Number(amount) });
      setBidAmount('');
      await fetchAuction(false);
    } catch (err) {
      setBidError(err.response?.data?.errors?.amount || err.response?.data?.error || 'تعذّرت المزايدة. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Submits the manually entered bid amount.
   * @param {React.FormEvent<HTMLFormElement>} e - Bid form submit event.
   * @returns {void} Starts bid submission when an amount exists.
   */
  const submitManualBid = (e) => {
    e.preventDefault();
    if (!bidAmount) return;
    handleBidSubmit(bidAmount);
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center p-4"><Spinner label="جاري تحميل تفاصيل المزاد..." /></div>;
  if (error && !auction) return <div className="flex min-h-[60vh] items-center justify-center p-4"><ErrorState message={error} onRetry={() => fetchAuction(true)} /></div>;
  if (!auction) return <div className="flex min-h-[60vh] items-center justify-center p-4"><div className="text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-paper text-text-secondary"><Icon name="gavel" className="h-8 w-8" /></div><p className="text-lg font-bold text-ink">لم يتم العثور على بيانات المزاد.</p></div></div>;

  // Normalize either a gallery or a single legacy image into one list.
  const imageList = (auction.images?.length ? auction.images : auction.imageUrl ? [auction.imageUrl] : []).map((image) => `${API_ORIGIN}${image}`);
  const creatorName = auction.createdBy?.companyName || auction.createdBy?.name || 'جهة معلنة';
  // Role-specific values used by the winner notice and bidding controls.
  const isWinner = user && auction.status === 'ended' && auction.currentHighestBidder?._id === user.id;
  const minBid = Number(auction.currentPrice) + 0.01;

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-16" dir="rtl">
      <nav aria-label="مسار التنقل" className="mb-6">
        <Link to="/auctions" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green">
          <svg className="h-4 w-4 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          العودة إلى المزادات
        </Link>
      </nav>

      {error ? <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-warning bg-surface p-4 text-sm text-warning"><Icon name="bell" className="mt-0.5 h-5 w-5 shrink-0" /><p>تعذّر تحديث السعر تلقائياً، وتظهر آخر بيانات متاحة.</p></div> : null}
      {isWinner ? <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-success bg-surface p-5 text-success shadow-sm sm:flex-row" role="status"><div className="flex items-center gap-3"><Icon name="sparkle" className="h-6 w-6 shrink-0" /><p className="font-bold">تهانينا، أنت الفائز بهذا المزاد.</p></div><Link to={`/auctions/${auction._id}/payment`}><Button variant="primary" className="shrink-0">الانتقال إلى الدفع التجريبي</Button></Link></div> : null}

      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusStamp status={auction.status} label={getStatusLabel(auction.status)} />
            <span className="px-3 py-1.5 rounded-full bg-paper text-text-secondary border border-border text-xs font-medium">
              مزاد #{auction._id.slice(-6)}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] leading-tight font-display font-bold text-ink mb-4">
            <bdi>{auction.title}</bdi>
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-secondary">
            <span className="flex items-center gap-2">
              <Icon name="bell" className="h-4 w-4" />
              نشر في {formatDate(auction.createdAt)}
            </span>
            <span className="flex items-center gap-2">
              <Icon name="document" className="h-4 w-4" />
              {creatorName}
            </span>
            <span className="flex items-center gap-2 text-registry-green font-semibold">
              <Icon name="shield" className="h-4 w-4" />
              مزاد موثوق
            </span>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="order-2 lg:order-1 min-w-0 space-y-8">
          <div className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface shadow-sm">
            <div className="relative bg-paper">
              <div className="relative aspect-[4/3] sm:aspect-[16/10]">
                {imageList.length > 0 ? (
                  <img src={imageList[currentSlide]} alt={`${auction.title} - صورة ${currentSlide + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-text-secondary"><Icon name="document" className="h-12 w-12 opacity-30" /></div>
                )}
              </div>
              {imageList.length > 1 ? (
                <>
                  <button type="button" onClick={() => setCurrentSlide((c) => (c - 1 + imageList.length) % imageList.length)} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur transition-colors hover:bg-ink/80 focus-visible:outline-1 focus-visible:outline-registry-green" aria-label="الصورة السابقة"><svg className="h-5 w-5 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
                  <button type="button" onClick={() => setCurrentSlide((c) => (c + 1) % imageList.length)} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur transition-colors hover:bg-ink/80 focus-visible:outline-1 focus-visible:outline-registry-green" aria-label="الصورة التالية"><svg className="h-5 w-5 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
                  <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur" dir="ltr">{currentSlide + 1} / {imageList.length}</span>
                </>
              ) : null}
            </div>
            {imageList.length > 1 ? (
              <div className="flex gap-2.5 overflow-x-auto border-t border-border bg-surface p-3 sm:p-4">
                {imageList.map((img, idx) => (
                  <button key={idx} type="button" onClick={() => setCurrentSlide(idx)} className={`h-14 w-16 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-20 ${currentSlide === idx ? 'outline outline-2 outline-offset-2 outline-registry-green' : ''}`}><img src={img} alt="" className="h-full w-full object-cover" /></button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border-2 border-ink/10 bg-surface p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 font-display text-xl font-bold text-ink">وصف المزاد</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink sm:text-base">{auction.description}</p>
          </div>

          {/* Bid History Section moved right under the description */}
          <div className="rounded-2xl border-2 border-ink/10 bg-surface shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">سجل المزايدات الحالية</h2>
                <p className="text-sm text-text-secondary mt-1">نشاط المزايدين الموثوقين</p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-bold text-registry-green bg-registry-green/10 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-registry-green animate-pulse"></span>
                تحديث مباشر
              </span>
            </div>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto bg-surface">
              <table className="w-full text-sm">
                <thead className="bg-paper border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="text-right px-6 py-4 font-bold text-text-secondary">المزايد</th>
                    <th className="text-left px-6 py-4 font-bold text-text-secondary">المبلغ</th>
                    <th className="text-left px-6 py-4 font-bold text-text-secondary">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {auction.bidHistory?.length ? (
                    auction.bidHistory.map((bid, idx) => {
                      const isTop = idx === 0;
                      const isMe = user && String(bid.bidder?._id || bid.bidder) === String(user.id);
                      const bidderName = isMe ? 'أنت' : (bid.bidder?.companyName || bid.bidder?.name || 'مستخدم');
                      return (
                        <tr key={bid._id} className={isTop ? 'bg-registry-green/5' : 'bg-surface'}>
                          <td className="px-6 py-4 font-bold text-ink">
                            {isMe ? <span className="text-registry-green">أنت <span className="text-text-secondary font-normal">(مزايدتك)</span></span> : bidderName}
                          </td>
                          <td className={`px-6 py-4 text-left font-bold tabular-nums ${isTop ? 'text-registry-green' : 'text-ink'}`} dir="ltr">
                            {formatMoney(bid.amount)}
                          </td>
                          <td className="px-6 py-4 text-left text-text-secondary text-xs tabular-nums" dir="ltr">
                            {new Date(bid.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-text-secondary text-sm font-bold">لا توجد مزايدات بعد.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {auction.itemFields?.length > 0 ? (
            <div className="rounded-2xl border-2 border-ink/10 bg-surface p-6 shadow-sm sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">مواصفات المنتج</h2>
                  <p className="mt-1 text-sm text-text-secondary">بيانات المنتج التي أضافتها الجهة المعلنة.</p>
                </div>
                <Icon name="document" className="h-6 w-6 shrink-0 text-registry-green" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {auction.itemFields.map((field, index) => (
                  <div key={`${field.key || field.label}-${index}`} className={`rounded-xl border border-border bg-paper px-4 py-3 ${auction.itemFields.length % 2 !== 0 && index === auction.itemFields.length - 1 ? 'sm:col-span-2' : ''}`}>
                    <p className="text-xs font-semibold text-text-secondary">{field.label}</p>
                    <p className="mt-1 text-sm font-bold text-ink">{field.value || 'غير محدد'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {auction.officialDocumentUrl ? (
            <div className="rounded-2xl border-2 border-ink/10 bg-surface p-6 shadow-sm sm:p-8">
              <h2 className="mb-4 font-display text-xl font-bold text-ink">وثيقة معلومات المنتج</h2>
              <a href={`${API_ORIGIN}${auction.officialDocumentUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-registry-green transition-colors hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
                <Icon name="document" className="h-5 w-5" />
                <bdi>{auction.officialDocumentName || 'فتح الوثيقة'}</bdi>
              </a>
            </div>
          ) : null}

        </section>

        <aside className="order-1 lg:order-2 space-y-6 lg:sticky lg:top-6" aria-label="لوحة المزايدة">
          <div className="bg-surface rounded-2xl border border-border shadow-lg overflow-hidden">
            {/* Countdown Header */}
            <div className="relative overflow-hidden bg-slate-900 text-white p-6">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="relative flex h-2.5 w-2.5">
                        {auction.status === 'active' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75"></span>}
                        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${auction.status === 'active' ? 'bg-warning' : 'bg-text-secondary'}`}></span>
                      </span>
                      {auction.status === 'ended' ? 'انتهى المزاد' : 'ينتهي المزاد خلال'}
                    </div>
                    <p className="text-xs text-paper/70 mt-1">
                      {auction.status === 'ended' ? 'لا يمكن تقديم مزايدات جديدة' : 'قدم أعلى مزايدة قبل انتهاء الوقت'}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-paper/70">
                    <Icon name="bell" className="h-5 w-5" />
                  </div>
                </div>
                {auction.status === 'active' && (
                  <div className="w-full text-center">
                    <AuctionCountdown endsAt={auction.endsAt} />
                  </div>
                )}
              </div>
            </div>

            {/* Price Information */}
            <div className="p-6 border-b border-border bg-surface">
              <div className="text-sm font-bold text-text-secondary mb-2">أعلى سعر حالي</div>
              <div className={`text-4xl font-display font-bold tracking-tight text-ink tabular-nums transition-colors duration-500 ${pricePulse ? 'text-registry-green' : ''}`} dir="ltr">
                {formatMoney(auction.currentPrice || auction.startingPrice)}
              </div>
              <div className="flex items-center justify-between mt-5 text-sm">
                <span className="text-text-secondary font-semibold">السعر الافتتاحي</span>
                <span className="font-bold text-ink tabular-nums" dir="ltr">{formatMoney(auction.startingPrice)}</span>
              </div>
            </div>

            {/* Bidding Section */}
            {auction.status === 'ended' ? (
              <div className="p-6">
                <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"><Icon name="sparkle" className="h-6 w-6" /></div>
                  <h3 className="mb-2 font-bold text-success-dark">انتهى المزاد</h3>
                  <p className="text-sm text-success-dark/80">{auction.currentHighestBidder ? 'انتهى المزاد لصالح المزايد الأعلى.' : 'لم يفز أحد بهذا المزاد.'}</p>
                </div>
              </div>
            ) : !user ? (
              <div className="p-6">
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
                  <div className="w-11 h-11 rounded-xl bg-surface text-warning-dark border border-warning/20 flex items-center justify-center mb-4"><Icon name="shield" className="h-5 w-5" /></div>
                  <h3 className="font-bold text-ink">سجل دخولك للمشاركة</h3>
                  <p className="text-sm text-text-secondary leading-6 mt-2 mb-5">يجب أن تكون مسجلاً للمشاركة في هذا المزاد.</p>
                  <Link to="/login"><Button variant="primary" className="w-full justify-center py-2.5 text-sm">تسجيل الدخول</Button></Link>
                </div>
              </div>
            ) : user.role === 'admin' ? (
              <div className="p-6">
                <div className="rounded-xl border border-registry-green/20 bg-registry-green/5 p-5">
                  <div className="w-11 h-11 rounded-xl bg-surface text-registry-green border border-registry-green/20 flex items-center justify-center mb-4"><Icon name="shield" className="h-5 w-5" /></div>
                  <h3 className="font-bold text-ink">عرض المشرف</h3>
                  <p className="text-sm text-text-secondary leading-6 mt-2">أنت تستعرض المزاد بصلاحيات مشرف. المزايدة معطلة.</p>
                </div>
              </div>
            ) : user.role === 'organization' && auction.createdBy?._id === user.id ? (
              <div className="p-6">
                <div className="rounded-xl border border-registry-green/20 bg-registry-green/5 p-5">
                  <div className="w-11 h-11 rounded-xl bg-surface text-registry-green border border-registry-green/20 flex items-center justify-center mb-4"><Icon name="document" className="h-5 w-5" /></div>
                  <h3 className="font-bold text-ink">مزادك الخاص</h3>
                  <p className="text-sm text-text-secondary leading-6 mt-2">أنت الجهة الطارحة لهذا المزاد. المزايدة معطلة لك.</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="bidAmount" className="text-sm font-bold text-ink">مزايدتك</label>
                  <span className="text-xs text-text-secondary font-bold">₪</span>
                </div>
                {bidError ? <div className="mb-3 rounded-lg border border-error/30 bg-error/5 px-3 py-2.5 text-sm font-bold text-error">{bidError}</div> : null}
                <form onSubmit={submitManualBid}>
                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">₪</span>
                    <input id="bidAmount" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} min={minBid} step="0.01" className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-border bg-paper text-lg font-bold tabular-nums text-ink outline-none focus:border-registry-green transition-colors" dir="ltr" disabled={isSubmitting} placeholder={minBid.toString()} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <button type="button" onClick={() => handleBidSubmit(Math.max(minBid, (Number(bidAmount) || minBid) + 50))} disabled={isSubmitting} className="px-3 py-2.5 rounded-lg border border-border bg-paper text-sm font-bold text-ink hover:bg-surface transition-colors">+50</button>
                    <button type="button" onClick={() => handleBidSubmit(Math.max(minBid, (Number(bidAmount) || minBid) + 100))} disabled={isSubmitting} className="px-3 py-2.5 rounded-lg border border-border bg-paper text-sm font-bold text-ink hover:bg-surface transition-colors">+100</button>
                    <button type="button" onClick={() => handleBidSubmit(Math.max(minBid, (Number(bidAmount) || minBid) + 250))} disabled={isSubmitting} className="px-3 py-2.5 rounded-lg border border-border bg-paper text-sm font-bold text-ink hover:bg-surface transition-colors">+250</button>
                  </div>
                  <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full justify-center py-4 text-base font-bold shadow-sm">
                    {isSubmitting ? <span className="flex items-center gap-2"><Spinner label="" className="h-4 w-4" /> جاري الإرسال...</span> : 'تأكيد المزايدة'}
                  </Button>
                </form>
                <div className="mt-4 flex items-start gap-2 text-xs text-text-secondary leading-5">
                  <Icon name="bell" className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>الحد الأدنى للمزايدة هو <strong className="text-ink tabular-nums" dir="ltr">{minBid} ₪</strong>.</span>
                </div>
              </div>
            )}


          </div>
        </aside>
      </div>
    </div>
  );
}
