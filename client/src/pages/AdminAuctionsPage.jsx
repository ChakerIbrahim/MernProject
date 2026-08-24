import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusStamp from '../components/StatusStamp';
import { getStatusLabel, formatMoney } from '../functions/formatters';
import Card from '../components/Card';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../functions/api';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmingAction, setConfirmingAction] = useState(null); // { auction, action: 'open' | 'close' | 'delete' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAuctions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/admin/auctions');
      setAuctions(response.data.auctions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل المزادات.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleAction = async () => {
    if (!confirmingAction) return;
    const { auction, action } = confirmingAction;
    setIsSubmitting(true);
    try {
      if (action === 'delete') {
        await api.delete(`/api/admin/auctions/${auction._id}`);
        setAuctions(auctions.filter(a => a._id !== auction._id));
      } else {
        const response = await api.patch(`/api/admin/auctions/${auction._id}/${action}`);
        setAuctions(auctions.map(a => a._id === auction._id ? response.data.auction : a));
      }
      setConfirmingAction(null);
    } catch (err) {
      alert(err.response?.data?.error || 'تعذّر تنفيذ الإجراء.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeading title="إدارة المزادات" />
      </div>

      {isLoading ? <div className="py-12"><Spinner label="جاري تحميل المزادات..." /></div> : error ? <ErrorState message={error} onRetry={fetchAuctions} /> : auctions.length === 0 ? <EmptyState message="لا توجد مزادات مسجلة بعد." /> : (
        <div className="grid gap-4">
          {auctions.map(auction => (
            <Card key={auction._id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Link to={`/auctions/${auction._id}`} className="font-bold text-ink text-lg hover:text-registry-green truncate"><bdi>{auction.title}</bdi></Link>
                  <StatusStamp status={auction.status} label={getStatusLabel(auction.status)} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                  <span>الجهة المعلنة: {auction.createdBy?.companyName || auction.createdBy?.name || 'غير متوفر'}</span>
                  <span>السعر الحالي: <bdi dir="ltr">{formatMoney(auction.currentPrice || auction.startingPrice)}</bdi></span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 sm:border-t-0 sm:pt-0 shrink-0">
                {auction.status === 'ended' || auction.status === 'cancelled' ? (
                  <Button variant="secondary" onClick={() => setConfirmingAction({ auction, action: 'open' })} disabled={isSubmitting}>إعادة فتح</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirmingAction({ auction, action: 'close' })} disabled={isSubmitting}>إغلاق</Button>
                )}
                <Button variant="danger" onClick={() => setConfirmingAction({ auction, action: 'delete' })} disabled={isSubmitting}>حذف</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmingAction}
        title={confirmingAction?.action === 'delete' ? 'حذف المزاد نهائياً' : confirmingAction?.action === 'open' ? 'إعادة فتح المزاد' : 'إغلاق المزاد'}
        message={confirmingAction?.action === 'delete' ? 'هل أنت متأكد من حذف هذا المزاد نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيؤدي لحذف سجل المزايدات.' : confirmingAction?.action === 'open' ? 'هل أنت متأكد من إعادة فتح هذا المزاد لاستقبال مزايدات جديدة؟' : 'هل أنت متأكد من إغلاق هذا المزاد؟ لن يتمكن أحد من المزايدة بعد الآن.'}
        confirmLabel={isSubmitting ? 'جاري التنفيذ...' : 'تأكيد'}
        onConfirm={handleAction}
        onCancel={() => !isSubmitting && setConfirmingAction(null)}
      />
    </div>
  );
}
