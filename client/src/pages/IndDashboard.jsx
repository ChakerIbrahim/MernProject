/**
 * Individual dashboard page.
 * Loads the user's active auction participation and shows winning or outbid results.
 * It provides loading, error, empty, and activity-card states without changing the API flow.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import api from '../functions/api';
import PageHeading from '../components/PageHeading';
import Button from '../components/Button';
import StatusStamp from '../components/StatusStamp';
import { formatMoney } from '../functions/formatters';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';

import Card from '../components/Card';
import Icon from '../components/Icon';

/**
 * Builds the individual dashboard.
 * @returns {JSX.Element} The current auction activity and navigation actions.
 */
export default function IndDashboard() {
  // Signed-in individual used for the welcome message.
  const { user } = useAuth();

  // Auctions where the individual is currently winning or outbid.
  const [activeBids, setActiveBids] = useState([]);
  // Controls the activity loading state.
  const [isLoading, setIsLoading] = useState(true);
  // Error shown when auction activity cannot be loaded.
  const [error, setError] = useState('');

  /**
   * Loads the individual's auction activity and keeps only relevant outcomes.
   * @returns {Promise<void>} Updates activity, loading, and error state.
   * @throws {Error} The Axios error is caught and shown in ErrorState.
   */
  const fetchActiveBids = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users/me/auctions');
      // Filter client-side per Sprint 17 specs: only winning or outbid
      const filtered = (response.data.auctions || []).filter(
        auction => auction.outcome === 'winning' || auction.outcome === 'outbid'
      );
      setActiveBids(filtered);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل نشاطك الحالي. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBids();
  }, []);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageHeading title="لوحة تحكم الفرد" />
          <p className="mt-1 text-sm text-text-secondary">مرحباً بك يا <bdi className="font-medium text-ink">{user?.name}</bdi></p>
        </div>
      </div>

      <section className="mb-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Icon name="gavel" className="h-5 w-5 text-registry-green" />
            <h2 className="font-display text-xl font-bold text-ink">نشاطي الحالي</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8"><Spinner label="جاري تحميل نشاطك الحالي..." /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchActiveBids} />
        ) : activeBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-registry-green/10 text-registry-green">
              <Icon name="gavel" className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-display text-lg font-bold text-ink">لم تشارك في أي مزاد بعد</h3>
            <p className="mb-6 text-sm text-text-secondary">تصفح المزادات النشطة الآن وابدأ بالمزايدة على الفرص المتاحة.</p>
            <Link to="/auctions">
              <Button variant="primary" className="flex items-center gap-2">
                <Icon name="arrow" className="h-4 w-4" />
                تصفح المزادات النشطة
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeBids.map((auction) => (
                <Card key={auction._id} className="flex flex-col justify-between gap-4 p-5 sm:p-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link to={`/auctions/${auction._id}`} className="text-lg font-bold text-ink hover:text-registry-green transition-colors focus-visible:outline-1 focus-visible:outline-registry-green line-clamp-2">
                        <bdi>{auction.title}</bdi>
                      </Link>
                    </div>
                    <div className="mb-1">
                      <StatusStamp status={auction.outcome} />
                    </div>

                    <div className="rounded-lg bg-paper p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">السعر الحالي:</span>
                        <bdi className="font-bold text-ink tabular-nums" dir="ltr">{formatMoney(auction.currentPrice)}</bdi>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-border/50 pt-2">
                        <span className="text-text-secondary">مزايدتك:</span>
                        <bdi className="font-medium text-text-secondary tabular-nums" dir="ltr">{formatMoney(auction.highestBid)}</bdi>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link to={`/auctions/${auction._id}`}>
                      <Button variant="secondary" className="w-full justify-center">تفاصيل المزاد</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Link to="/auctions">
                <Button variant="secondary" className="flex items-center gap-2">
                  <Icon name="arrow" className="h-4 w-4" />
                  تصفح المزيد من المزادات
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
