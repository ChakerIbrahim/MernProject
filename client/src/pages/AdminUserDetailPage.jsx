import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/Card';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import Icon from '../components/Icon';
import api from '../functions/api';
import { formatDate } from '../functions/formatters';

import { API_ORIGIN } from '../functions/backendUrl';

const statusLabels = {
  approved: 'نشط',
  deactivated: 'معطّل',
  pending: 'قيد المراجعة',
  pending_verification: 'بانتظار التفعيل',
  rejected: 'مرفوض'
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmingAction, setConfirmingAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUser = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/admin/users/${id}`);
      setUser(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل تفاصيل الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleAction = async () => {
    if (!user || !confirmingAction) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      if (confirmingAction === 'delete') {
        await api.delete(`/api/admin/users/${user._id}`);
        window.location.assign('/admin/users');
        return;
      }
      const response = await api.patch(`/api/admin/users/${user._id}/${confirmingAction}`);
      setUser(response.data.user);
      setConfirmingAction('');
    } catch (err) {
      setActionError(err.response?.data?.error || 'تعذّر تنفيذ الإجراء.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="py-12"><Spinner label="جاري تحميل تفاصيل الحساب..." /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchUser} />;
  if (!user) return null;

  const isInactive = user.status === 'deactivated' || user.status === 'rejected';
  const displayName = user.companyName || user.name;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green"><Icon name="arrow" className="h-4 w-4 rotate-180" /> العودة إلى الحسابات</Link>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><PageHeading title="تفاصيل الحساب" /><p className="mt-2 text-sm text-text-secondary">راجع بيانات الحساب واتخذ الإجراء الإداري المناسب.</p></div><span className={`rounded-full px-3 py-1.5 text-sm font-bold ${isInactive ? 'bg-error/10 text-error' : user.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{statusLabels[user.status] || user.status}</span></div>

      {actionError ? <div role="alert" className="rounded-xl border border-error bg-error/5 p-4 text-sm font-semibold text-error">{actionError}</div> : null}

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">إجراءات الحساب</h2>
            <p className="mt-1 text-sm text-text-secondary">إدارة حالة الحساب واتخاذ الإجراء الإداري المناسب.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user.status === 'pending' ? (
              <Button variant="primary" onClick={() => setConfirmingAction('activate')} disabled={isSubmitting}>قبول الطلب وتفعيل الحساب</Button>
            ) : isInactive ? (
              <Button variant="secondary" onClick={() => setConfirmingAction('activate')} disabled={isSubmitting}>إعادة تفعيل الحساب</Button>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmingAction('deactivate')} disabled={isSubmitting}>تعطيل الحساب</Button>
            )}
            <Button variant="danger" onClick={() => setConfirmingAction('delete')} disabled={isSubmitting}>حذف الحساب</Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-4 border-b border-border bg-paper/60 p-6"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-registry-green/10 font-display text-xl font-bold text-registry-green">{displayName?.charAt(0) || 'م'}</div><div><h2 className="font-display text-xl font-bold text-ink"><bdi>{displayName}</bdi></h2><p className="mt-1 text-sm text-text-secondary">{user.role === 'organization' ? 'حساب مؤسسة' : 'حساب فرد'}</p></div></div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          <div className="bg-surface p-5"><p className="text-xs font-semibold text-text-secondary">الاسم</p><p className="mt-2 font-bold text-ink"><bdi>{user.name}</bdi></p></div>
          <div className="bg-surface p-5"><p className="text-xs font-semibold text-text-secondary">البريد الإلكتروني</p><p className="mt-2 font-bold text-ink" dir="ltr">{user.email}</p></div>
          <div className="bg-surface p-5"><p className="text-xs font-semibold text-text-secondary">الدور</p><p className="mt-2 font-bold text-ink">{user.role === 'organization' ? 'مؤسسة' : 'فرد'}</p></div>
          <div className="bg-surface p-5"><p className="text-xs font-semibold text-text-secondary">تاريخ التسجيل</p><p className="mt-2 font-bold text-ink" dir="ltr">{formatDate(user.createdAt)}</p></div>
          {user.companyName ? <div className="bg-surface p-5"><p className="text-xs font-semibold text-text-secondary">اسم المؤسسة</p><p className="mt-2 font-bold text-ink"><bdi>{user.companyName}</bdi></p></div> : null}
          {user.phoneNumber ? <div className="bg-surface p-5"><p className="text-xs font-semibold text-text-secondary">رقم الهاتف</p><p className="mt-2 font-bold text-ink" dir="ltr">{user.phoneNumber}</p></div> : null}
          {user.nationalId ? <div className="bg-surface p-5"><p className="text-xs font-semibold text-text-secondary">رقم الهوية</p><p className="mt-2 font-bold text-ink" dir="ltr">{user.nationalId}</p></div> : null}
        </div>
      </Card>

      {user.proofDocumentUrl ? (
        <Card className="p-6">
          <h2 className="mb-3 font-display text-lg font-bold text-ink">
            {user.role === 'individual' ? 'صورة الهوية الوطنية' : 'مستند إثبات المؤسسة'}
          </h2>
          <a href={user.proofDocumentUrl.startsWith('http') ? user.proofDocumentUrl : `${API_ORIGIN}${user.proofDocumentUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-registry-green transition-colors hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
            <Icon name="document" className="h-5 w-5" /> عرض المستند
          </a>

          {user.aiVerification && (
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="mb-3 font-display text-md font-bold text-ink">نتيجة تدقيق الذكاء الاصطناعي</h3>
              <div className={`rounded-lg border p-4 text-sm ${user.aiVerification.isValid ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
                <div className="flex items-center gap-2 font-bold mb-3 text-ink">
                  <Icon name={user.aiVerification.isValid ? "check" : "bell"} className={`h-5 w-5 ${user.aiVerification.isValid ? 'text-success' : 'text-warning'}`} />
                  <span>{user.aiVerification.isValid ? 'الهوية تبدو صالحة' : 'تحتاج الهوية لمراجعة إضافية'}</span>
                  <span className="text-xs font-normal text-text-secondary ms-auto">الثقة: {user.aiVerification.confidenceScore * 100}%</span>
                </div>
                <div className="grid gap-2 text-text-secondary">
                  <p><span className="font-semibold text-ink">الاسم المستخرج:</span> {user.aiVerification.name}</p>
                  <p><span className="font-semibold text-ink">رقم الهوية المستخرج:</span> <span dir="ltr">{user.aiVerification.nationalId}</span></p>
                  {user.aiVerification.notes && <p><span className="font-semibold text-ink">ملاحظات:</span> {user.aiVerification.notes}</p>}
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirmingAction)}
        title={confirmingAction === 'delete' ? 'حذف الحساب نهائياً' : confirmingAction === 'activate' ? 'تفعيل الحساب' : 'تعطيل الحساب'}
        message={confirmingAction === 'delete' ? 'هل أنت متأكد من حذف الحساب نهائياً؟' : confirmingAction === 'activate' ? 'هل تريد تفعيل الحساب والسماح له باستخدام المنصة؟' : 'هل تريد تعطيل الحساب ومنع تسجيل الدخول؟'}
        confirmLabel={isSubmitting ? 'جاري التنفيذ...' : 'تأكيد'}
        onConfirm={handleAction}
        onCancel={() => !isSubmitting && setConfirmingAction('')}
      />
    </div>
  );
}
