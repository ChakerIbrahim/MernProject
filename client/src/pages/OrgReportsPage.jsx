/**
 * Organization reports page.
 * Loads a small operational summary for tenders, auctions, and proposals.
 * The page returns loading, error, and summary states using the shared Axios client.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import api from '../functions/api';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/Card';
import Icon from '../components/Icon';

/**
 * Builds the organization reports page.
 * @returns {JSX.Element} A summary of the organization's current activity.
 */
export default function OrgReportsPage() {
  // The signed-in organization used to request its own summary data.
  const { user } = useAuth();
  // Counts calculated from the three API responses.
  const [summary, setSummary] = useState(null);
  // Shows the loading spinner while the summary requests are running.
  const [isLoading, setIsLoading] = useState(true);
  // Stores the message shown when a request fails.
  const [error, setError] = useState('');

  /**
   * Loads tenders, auctions, and proposals, then calculates summary counts.
   * @returns {Promise<void>} Resolves after summary state is updated.
   * @throws {Error} The Axios error is caught and saved in error state.
   */
  const fetchSummary = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [tendersResponse, auctionsResponse, proposalsResponse] = await Promise.all([
        api.get(`/api/tenders?ownerId=${user.id}`),
        api.get('/api/users/me/created-auctions'),
        api.get('/api/users/me/proposals')
      ]);
      // Normalize missing arrays so the count calculations remain safe.
      const tenders = tendersResponse.data.tenders || [];
      const auctions = auctionsResponse.data.auctions || [];
      const proposals = proposalsResponse.data.proposals || [];
      setSummary({
        tenders: tenders.length,
        openTenders: tenders.filter((item) => item.status === 'open').length,
        auctions: auctions.length,
        proposals: proposals.length,
        pendingProposals: proposals.filter((item) => item.status === 'submitted').length
      });
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل تقارير المؤسسة. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [user?.id]);

  return (
    <div className="space-y-6">
      <div><PageHeading title="التقارير" /><p className="mt-2 text-sm text-ink/75">ملخص تشغيلي سريع لنشاط المؤسسة في اعتماد.</p></div>
      {isLoading ? <div className="py-12"><Spinner label="جاري تحميل التقارير..." /></div> : error ? <ErrorState message={error} onRetry={fetchSummary} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[
        { label: 'إجمالي العطاءات', value: summary.tenders, icon: 'document' },
        { label: 'العطاءات المفتوحة', value: summary.openTenders, icon: 'arrow' },
        { label: 'إجمالي المزادات', value: summary.auctions, icon: 'gavel' },
        { label: 'العروض المقدمة', value: summary.proposals, icon: 'document' },
        { label: 'العروض بانتظار المراجعة', value: summary.pendingProposals, icon: 'bell' }
      ].map((item) => <Card key={item.label} className="flex items-center justify-between gap-4 border-s-4 border-s-registry-green p-5"><div><p className="text-sm font-medium text-ink/75">{item.label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-ink">{item.value}</p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-registry-green/10 text-registry-green"><Icon name={item.icon} className="h-6 w-6" /></span></Card>)}</div>}
    </div>
  );
}
