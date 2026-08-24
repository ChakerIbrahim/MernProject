import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusStamp from '../components/StatusStamp';
import { formatMoney } from '../functions/formatters';

import ResponsiveTable from '../components/ResponsiveTable';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import api from '../functions/api';

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchMyAuctions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users/me/auctions');
      setAuctions(response.data.auctions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل سجل مزاداتك. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAuctions();
  }, []);

  const getActionContent = (auction) => {
    if (auction.outcome === 'won') {
      return (
        <Link to={`/auctions/${auction._id}/payment`}>
          <Button variant="primary" className="text-xs py-1.5 px-3 whitespace-nowrap">
            تأكيد الدفع التجريبي
          </Button>
        </Link>
      );
    }
    return (
      <Link to={`/auctions/${auction._id}`}>
        <Button variant="secondary" className="text-xs py-1.5 px-3 whitespace-nowrap">
          عرض التفاصيل
        </Button>
      </Link>
    );
  };

  const renderMobileCard = (row) => {
    const auction = auctions.find(a => a._id === row.id);
    if (!auction) return null;

    return (
      <Card key={row.id} className="p-4 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <Link to={`/auctions/${auction._id}`} className="font-bold text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green line-clamp-2">
            <bdi>{auction.title}</bdi>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface border border-border p-3">
          <div>
            <p className="text-xs text-text-secondary mb-1">أعلى مزايدة لك</p>
            <bdi className="tabular-nums font-bold text-ink" dir="ltr">{formatMoney(auction.highestBid)}</bdi>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">السعر الحالي/النهائي</p>
            <bdi className="tabular-nums font-bold text-ink" dir="ltr">{formatMoney(auction.currentPrice)}</bdi>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <StatusStamp status={auction.outcome} />
          {getActionContent(auction)}
        </div>
      </Card>
    );
  };

  return (
    <>
      <div className="mb-8">
        <PageHeading title="مزاداتي" />
        <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">
          سجل كامل لجميع المزادات التي شاركت فيها، مع حالة كل مزاد ونتيجته النهائية.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12"><Spinner label="جاري تحميل سجل المزادات..." /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMyAuctions} />
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-registry-green/10 text-registry-green">
            <Icon name="gavel" className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-lg font-bold text-ink">لم تشارك في أي مزاد بعد</h3>
          <p className="mb-6 text-sm text-text-secondary">تصفح المزادات النشطة وابدأ المزايدة الآن لتظهر هنا.</p>
          <Link to="/auctions">
            <Button variant="primary" className="flex items-center gap-2">
              <Icon name="arrow" className="h-4 w-4" />
              تصفح المزادات
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <ResponsiveTable
            headers={['المزاد', 'أعلى مزايدة لك', 'السعر الحالي/النهائي', 'الحالة', 'الإجراء']}
            rows={auctions.map(auction => ({
              id: auction._id,
              cells: [
                <Link to={`/auctions/${auction._id}`} className="font-bold text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green">
                  <bdi>{auction.title}</bdi>
                </Link>,
                <bdi className="tabular-nums font-medium text-ink" dir="ltr">{formatMoney(auction.highestBid)}</bdi>,
                <bdi className="tabular-nums font-medium text-ink" dir="ltr">{formatMoney(auction.currentPrice)}</bdi>,
                <StatusStamp status={auction.outcome} />,
                getActionContent(auction)
              ]
            }))}
            renderMobileCard={renderMobileCard}
          />
        </div>
      )}
    </>
  );
}
