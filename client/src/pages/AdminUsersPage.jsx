/**
 * Administrator account list.
 * Loads non-admin users and gives the administrator links to inspect, activate, deactivate, or delete accounts.
 * Confirmation dialogs protect actions that change account access or data.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../functions/api';

/**
 * Builds the administrator account-management page.
 * @returns {JSX.Element} Account list, action buttons, and confirmation dialog.
 */
export default function AdminUsersPage() {
  // User records returned by the admin endpoint.
  const [users, setUsers] = useState([]);
  // Controls the initial account-list spinner.
  const [isLoading, setIsLoading] = useState(true);
  // Error shown when accounts cannot be loaded.
  const [error, setError] = useState('');

  const [confirmingAction, setConfirmingAction] = useState(null); // { user, action: 'activate' | 'deactivate' | 'delete' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Loads all non-admin accounts for the list.
   * @returns {Promise<void>} Updates users, loading, and error state.
   * @throws {Error} The Axios error is caught and shown in ErrorState.
   */
  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/admin/users');
      // The endpoint returns all non-admin users. We don't need to filter here, but we can if we want to show pending individuals first.
      setUsers(response.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل الحسابات.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Executes the selected activate, deactivate, or delete action.
   * @returns {Promise<void>} Updates the list after a successful action.
   * @throws {Error} The Axios error is caught and shown in an alert.
   */
  const handleAction = async () => {
    if (!confirmingAction) return;
    const { user, action } = confirmingAction;
    setIsSubmitting(true);
    try {
      if (action === 'delete') {
        await api.delete(`/api/admin/users/${user._id}`);
        setUsers(users.filter(u => u._id !== user._id));
      } else {
        const response = await api.patch(`/api/admin/users/${user._id}/${action}`);
        setUsers(users.map(u => u._id === user._id ? response.data.user : u));
      }
      setConfirmingAction(null);
    } catch (err) {
      alert(err.response?.data?.error || 'تعذّر تنفيذ الإجراء.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Converts a server status into a styled Arabic badge.
   * @param {string} status - Account status from the API.
   * @returns {JSX.Element} The matching status badge.
   */
  const getStatusBadge = (status) => {
    const config = {
      approved: { bg: 'bg-success/10', text: 'text-success', label: 'نشط' },
      deactivated: { bg: 'bg-error/10', text: 'text-error', label: 'معطّل' },
      pending: { bg: 'bg-warning/10', text: 'text-warning', label: 'قيد المراجعة' },
      pending_verification: { bg: 'bg-ink/10', text: 'text-ink', label: 'بانتظار التفعيل' },
      rejected: { bg: 'bg-error/10', text: 'text-error', label: 'مرفوض' }
    };
    const style = config[status] || config.pending;
    return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.bg} ${style.text}`}>{style.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeading title="إدارة الحسابات" />
      </div>

      {isLoading ? <div className="py-12"><Spinner label="جاري تحميل الحسابات..." /></div> : error ? <ErrorState message={error} onRetry={fetchUsers} /> : users.length === 0 ? <EmptyState message="لا توجد حسابات مسجلة بعد." /> : (
        <div className="grid gap-4">
          {users.map(user => (
            <Card key={user._id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-ink text-lg"><bdi>{user.companyName || user.name}</bdi></h3>
                  {getStatusBadge(user.status)}
                  <span className="text-xs text-text-secondary bg-paper px-2 py-1 rounded-full">{user.role === 'organization' ? 'مؤسسة' : 'فرد'}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                  <span>{user.email}</span>
                  {user.phoneNumber && <span dir="ltr">{user.phoneNumber}</span>}
                  {user.nationalId && <span>هوية: {user.nationalId}</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 sm:border-t-0 sm:pt-0 shrink-0">
                <Link to={`/admin/users/${user._id}`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">تفاصيل الحساب</Link>
                {user.status === 'deactivated' || user.status === 'rejected' ? (
                  <Button variant="secondary" onClick={() => setConfirmingAction({ user, action: 'activate' })} disabled={isSubmitting}>تفعيل</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirmingAction({ user, action: 'deactivate' })} disabled={isSubmitting}>تعطيل</Button>
                )}
                <Button variant="danger" onClick={() => setConfirmingAction({ user, action: 'delete' })} disabled={isSubmitting}>حذف</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmingAction}
        title={confirmingAction?.action === 'delete' ? 'حذف الحساب نهائياً' : confirmingAction?.action === 'activate' ? 'تفعيل الحساب' : 'تعطيل الحساب'}
        message={confirmingAction?.action === 'delete' ? 'هل أنت متأكد من حذف هذا الحساب نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيؤدي لحذف بيانات الدخول.' : confirmingAction?.action === 'activate' ? 'هل أنت متأكد من تفعيل هذا الحساب والسماح له باستخدام المنصة مجدداً؟' : 'هل أنت متأكد من تعطيل هذا الحساب؟ لن يتمكن المستخدم من تسجيل الدخول.'}
        confirmLabel={isSubmitting ? 'جاري التنفيذ...' : 'تأكيد'}
        onConfirm={handleAction}
        onCancel={() => !isSubmitting && setConfirmingAction(null)}
      />
    </div>
  );
}
