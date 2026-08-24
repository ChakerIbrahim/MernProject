/**
 * Organization profile page.
 * Displays the signed-in organization's stored account information and approval status.
 * It is a read-only view with a link back to the organization dashboard.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import PageHeading from '../components/PageHeading';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';

/**
 * Displays one label-and-value row in the profile details list.
 * @param {string} label - Arabic label shown on the left side of the row.
 * @param {string} value - Account value shown on the right side.
 * @param {string} [direction] - Optional text direction for email or phone values.
 * @returns {JSX.Element} One definition-list row.
 */
function ProfileRow({ label, value, direction }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="font-medium text-ink" dir={direction}>{value || 'غير متوفر'}</dd>
    </div>
  );
}

/**
 * Builds the organization profile page.
 * Reads the current user from authentication context and returns profile information.
 * @returns {JSX.Element} The organization profile view.
 */
export default function OrgProfilePage() {
  // The authenticated organization whose profile is displayed.
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeading title="ملفي" />
          <p className="mt-2 text-sm leading-7 text-text-secondary">راجع بيانات المؤسسة وحالة اعتماد الحساب.</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-registry-green/10 text-registry-green">
          <Icon name="shield" className="h-6 w-6" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-paper p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-registry-green text-xl font-bold text-surface">
              {(user?.companyName || user?.name || 'م').slice(0, 1)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink"><bdi>{user?.companyName || 'مؤسسة اعتماد'}</bdi></h2>
              <p className="mt-1 text-sm text-text-secondary"><bdi>{user?.name}</bdi></p>
            </div>
          </div>
        </div>

        <dl className="px-6">
          <ProfileRow label="اسم ممثل المؤسسة" value={user?.name} />
          <ProfileRow label="اسم المؤسسة" value={user?.companyName} />
          <ProfileRow label="البريد الإلكتروني" value={user?.email} direction="ltr" />
          <ProfileRow label="رقم الهاتف" value={user?.phoneNumber} direction="ltr" />
          <ProfileRow label="حالة الحساب" value={user?.status === 'approved' ? 'معتمد' : 'قيد المراجعة'} />
        </dl>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to="/org/dashboard">
          <Button variant="primary">العودة إلى لوحة التحكم</Button>
        </Link>
      </div>
    </div>
  );
}
