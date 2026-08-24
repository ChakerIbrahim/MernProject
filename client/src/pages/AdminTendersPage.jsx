import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusStamp from '../components/StatusStamp';
import { getStatusLabel, formatDate } from '../functions/formatters';
import Card from '../components/Card';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../functions/api';

export default function AdminTendersPage() {
  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmingAction, setConfirmingAction] = useState(null); // { tender, action: 'open' | 'close' | 'delete' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTenders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/admin/tenders');
      setTenders(response.data.tenders || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل العطاءات.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleAction = async () => {
    if (!confirmingAction) return;
    const { tender, action } = confirmingAction;
    setIsSubmitting(true);
    try {
      if (action === 'delete') {
        await api.delete(`/api/admin/tenders/${tender._id}`);
        setTenders(tenders.filter(t => t._id !== tender._id));
      } else {
        const response = await api.patch(`/api/admin/tenders/${tender._id}/${action}`);
        setTenders(tenders.map(t => t._id === tender._id ? response.data.tender : t));
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
        <PageHeading title="إدارة العطاءات" />
      </div>

      {isLoading ? <div className="py-12"><Spinner label="جاري تحميل العطاءات..." /></div> : error ? <ErrorState message={error} onRetry={fetchTenders} /> : tenders.length === 0 ? <EmptyState message="لا توجد عطاءات مسجلة بعد." /> : (
        <div className="grid gap-4">
          {tenders.map(tender => (
            <Card key={tender._id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Link to={`/tenders/${tender._id}`} className="font-bold text-ink text-lg hover:text-registry-green truncate"><bdi>{tender.title}</bdi></Link>
                  <StatusStamp status={tender.status} label={getStatusLabel(tender.status)} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                  <span>الجهة الطارحة: {tender.createdBy?.companyName || tender.createdBy?.name || 'غير متوفر'}</span>
                  <span>الموعد النهائي: <bdi dir="ltr">{formatDate(tender.deadline)}</bdi></span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 sm:border-t-0 sm:pt-0 shrink-0">
                {tender.status === 'closed' ? (
                  <Button variant="secondary" onClick={() => setConfirmingAction({ tender, action: 'open' })} disabled={isSubmitting}>إعادة فتح</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirmingAction({ tender, action: 'close' })} disabled={isSubmitting}>إغلاق</Button>
                )}
                <Button variant="danger" onClick={() => setConfirmingAction({ tender, action: 'delete' })} disabled={isSubmitting}>حذف</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmingAction}
        title={confirmingAction?.action === 'delete' ? 'حذف العطاء نهائياً' : confirmingAction?.action === 'open' ? 'إعادة فتح العطاء' : 'إغلاق العطاء'}
        message={confirmingAction?.action === 'delete' ? 'هل أنت متأكد من حذف هذا العطاء نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيؤدي لحذف العروض المرتبطة به.' : confirmingAction?.action === 'open' ? 'هل أنت متأكد من إعادة فتح هذا العطاء لاستقبال عروض جديدة؟' : 'هل أنت متأكد من إغلاق هذا العطاء؟ لن يتمكن أحد من تقديم عروض جديدة.'}
        confirmLabel={isSubmitting ? 'جاري التنفيذ...' : 'تأكيد'}
        onConfirm={handleAction}
        onCancel={() => !isSubmitting && setConfirmingAction(null)}
      />
    </div>
  );
}
