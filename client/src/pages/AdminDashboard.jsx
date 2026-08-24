/**
 * Administrator dashboard.
 * Shows platform KPIs, charts, pending organizations, and auctions waiting for approval.
 * Admin actions use Axios and update the lists optimistically with rollback on failure.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../components/AuthContext';
import PageHeading from '../components/PageHeading';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import StatusStamp from '../components/StatusStamp';
import { getStatusLabel, formatMoney } from '../functions/formatters';

import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../functions/api';

/** Base server URL used to open uploaded proof documents. */
import { API_ORIGIN } from '../functions/backendUrl';

/**
 * Builds the administrator overview page.
 * @returns {JSX.Element} KPI cards, charts, review lists, and confirmation dialogs.
 */
export default function AdminDashboard() {
  // Auth action used by the logout button.
  const { logout } = useAuth();

  // Data state: pending reviews, active totals, and chart series.
  const [organizations, setOrganizations] = useState([]);
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [activeTendersCount, setActiveTendersCount] = useState(0);
  const [activeAuctionsCount, setActiveAuctionsCount] = useState(0);
  const [graphData, setGraphData] = useState({ users: [], activity: [] });

  // Loading state
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);

  // Error state
  const [organizationError, setOrganizationError] = useState('');
  const [auctionError, setAuctionError] = useState('');
  const [actionError, setActionError] = useState('');

  // Action state
  const [confirmingOrgApprove, setConfirmingOrgApprove] = useState(null);
  const [confirmingOrgReject, setConfirmingOrgReject] = useState(null);
  const [confirmingAuctionApprove, setConfirmingAuctionApprove] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Loads organizations waiting for administrator review.
   * @returns {Promise<void>} Updates organization list and loading/error state.
   * @throws {Error} The Axios error is caught and displayed in the page.
   */
  const fetchOrganizations = async () => {
    setIsLoadingOrganizations(true);
    setOrganizationError('');
    try {
      const response = await api.get('/api/admin/organizations/pending');
      setOrganizations(response.data.organizations || []);
    } catch (err) {
      setOrganizationError(err.response?.data?.error || 'تعذّر تحميل طلبات المؤسسات. حاول مرة أخرى.');
    } finally {
      setIsLoadingOrganizations(false);
    }
  };

  /**
   * Loads auctions waiting for administrator approval.
   * @returns {Promise<void>} Updates auction list and loading/error state.
   * @throws {Error} The Axios error is caught and displayed in the page.
   */
  const fetchPendingAuctions = async () => {
    setIsLoadingAuctions(true);
    setAuctionError('');
    try {
      const response = await api.get('/api/admin/auctions/pending');
      setPendingAuctions(response.data.auctions || []);
    } catch (err) {
      setAuctionError(err.response?.data?.error || 'تعذّر تحميل المزادات المعلّقة. حاول مرة أخرى.');
    } finally {
      setIsLoadingAuctions(false);
    }
  };

  /**
   * Loads tender, auction, and user data used by the KPI charts.
   * @returns {Promise<void>} Updates counts and graphData.
   * @throws {Error} The Axios error is caught and leaves the current chart state unchanged.
   */
  const fetchKpis = async () => {
    setIsLoadingKpis(true);
    try {
      const [tendersRes, auctionsRes, usersRes] = await Promise.all([
        api.get('/api/tenders'),
        api.get('/api/auctions'),
        api.get('/api/admin/users')
      ]);

      const openTenders = tendersRes.data.tenders?.length || 0;
      const openAuctions = auctionsRes.data.auctions?.length || 0;
      setActiveTendersCount(openTenders);
      setActiveAuctionsCount(openAuctions);

      const users = usersRes.data.users || [];
      const orgs = users.filter(u => u.role === 'organization').length;
      const inds = users.filter(u => u.role === 'individual').length;

      setGraphData({
        users: [
          { name: 'مؤسسات', value: orgs, color: '#007A3D' },
          { name: 'أفراد', value: inds, color: '#60A5FA' }
        ],
        activity: [
          { name: 'العطاءات المفتوحة', count: openTenders },
          { name: 'المزادات النشطة', count: openAuctions }
        ]
      });
    } catch (err) {
      console.error("Failed to load KPIs", err);
    } finally {
      setIsLoadingKpis(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchPendingAuctions();
    fetchKpis();
  }, []);

  /**
   * Approves the selected organization and removes it from the pending list.
   * @returns {Promise<void>} Updates the list or restores it after failure.
   * @throws {Error} The Axios error is caught and shown in actionError.
   */
  const handleApproveOrganization = async () => {
    if (!confirmingOrgApprove) return;
    const id = confirmingOrgApprove._id;
    const orgData = confirmingOrgApprove;

    setIsSubmitting(true);
    setActionError('');

    // Optimistic UI update
    setOrganizations((items) => items.filter((item) => item._id !== id));
    setConfirmingOrgApprove(null);

    try {
      const response = await api.patch(`/api/admin/organizations/${id}/approve`);
      if (!response.data.emailSent) {
        setActionError('تم اعتماد المؤسسة، لكن تعذّر إرسال إشعار البريد الإلكتروني.');
      }
    } catch (err) {
      // Rollback on failure
      setOrganizations((items) => [...items, orgData]);
      setActionError(err.response?.data?.error || 'تعذّرت الموافقة على المؤسسة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Rejects the selected organization with the entered reason.
   * @param {React.FormEvent<HTMLFormElement>|undefined} event - Optional dialog submit event.
   * @returns {Promise<void>} Updates the list or restores it after failure.
   * @throws {Error} The Axios error is caught and shown in actionError.
   */
  const handleRejectOrganization = async (event) => {
    if (event) event.preventDefault();
    if (!confirmingOrgReject) return;

    const id = confirmingOrgReject._id;
    const orgData = confirmingOrgReject;

    setIsSubmitting(true);
    setActionError('');

    // Optimistic UI update
    setOrganizations((items) => items.filter((item) => item._id !== id));
    setConfirmingOrgReject(null);

    try {
      const response = await api.patch(`/api/admin/organizations/${id}/reject`, { rejectionReason });
      if (!response.data.emailSent) {
        setActionError('تم رفض المؤسسة، لكن تعذّر إرسال إشعار البريد الإلكتروني.');
      }
      setRejectionReason('');
    } catch (err) {
      // Rollback on failure
      setOrganizations((items) => [...items, orgData]);
      setActionError(err.response?.data?.error || 'تعذّر رفض المؤسسة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Approves the selected auction and updates the active-auction count.
   * @returns {Promise<void>} Updates the list or restores it after failure.
   * @throws {Error} The Axios error is caught and shown in actionError.
   */
  const handleApproveAuction = async () => {
    if (!confirmingAuctionApprove) return;

    const id = confirmingAuctionApprove._id;
    const auctionData = confirmingAuctionApprove;

    setIsSubmitting(true);
    setActionError('');

    // Optimistic UI update
    setPendingAuctions((items) => items.filter((item) => item._id !== id));
    setConfirmingAuctionApprove(null);

    try {
      await api.patch(`/api/admin/auctions/${id}/approve`);
      // Update KPI since an auction was just approved
      setActiveAuctionsCount(prev => prev + 1);
    } catch (err) {
      // Rollback on failure
      setPendingAuctions((items) => [...items, auctionData]);
      setActionError(err.response?.data?.error || 'تعذّر اعتماد المزاد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <PageHeading title="نظرة عامة" />
        <Button variant="secondary" onClick={logout}>تسجيل الخروج</Button>
      </div>

      {actionError && (
        <div role="alert" className="mb-6 rounded-xl border border-error bg-red-50 p-4 text-error text-sm flex gap-3 items-start">
          <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>{actionError}</p>
        </div>
      )}

      {/* KPI Section */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 flex flex-col gap-2">
            <span className="text-sm font-medium text-text-secondary">مؤسسات قيد المراجعة</span>
            {isLoadingOrganizations ? (
              <div className="h-8 w-16 animate-pulse rounded bg-border"></div>
            ) : (
              <span className="text-3xl font-bold text-ink tabular-nums">{organizations.length}</span>
            )}
          </Card>

          <Card className="p-6 flex flex-col gap-2">
            <span className="text-sm font-medium text-text-secondary">مزادات بانتظار الاعتماد</span>
            {isLoadingAuctions ? (
              <div className="h-8 w-16 animate-pulse rounded bg-border"></div>
            ) : (
              <span className="text-3xl font-bold text-ink tabular-nums">{pendingAuctions.length}</span>
            )}
          </Card>

          <Card className="p-6 flex flex-col gap-2">
            <span className="text-sm font-medium text-text-secondary">العطاءات المفتوحة</span>
            {isLoadingKpis ? (
              <div className="h-8 w-16 animate-pulse rounded bg-border"></div>
            ) : (
              <span className="text-3xl font-bold text-ink tabular-nums">{activeTendersCount}</span>
            )}
          </Card>

          <Card className="p-6 flex flex-col gap-2">
            <span className="text-sm font-medium text-text-secondary">المزادات النشطة</span>
            {isLoadingKpis ? (
              <div className="h-8 w-16 animate-pulse rounded bg-border"></div>
            ) : (
              <span className="text-3xl font-bold text-ink tabular-nums">{activeAuctionsCount}</span>
            )}
          </Card>
        </div>
      </section>

      {/* Analytics Graphs */}
      {!isLoadingKpis && (
        <section className="mb-12 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-6 font-display text-lg font-bold text-ink">توزيع المستخدمين</h3>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={graphData.users} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {graphData.users.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'مستخدم']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-6">
              {graphData.users.map(entry => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-sm font-semibold text-text-secondary">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 font-display text-lg font-bold text-ink">النشاط الحالي</h3>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData.activity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F7F8FA' }} formatter={(value) => [value, 'نشط']} />
                  <Bar dataKey="count" fill="#007A3D" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      {/* Pending Organizations Section */}
      <section className="mb-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">مراجعة المؤسسات</h2>
        </div>

        {isLoadingOrganizations ? (
          <div className="py-12"><Spinner label="جاري تحميل طلبات المؤسسات..." /></div>
        ) : organizationError ? (
          <ErrorState message={organizationError} onRetry={fetchOrganizations} />
        ) : organizations.length === 0 ? (
          <EmptyState message="لا توجد طلبات مؤسسات قيد المراجعة" />
        ) : (
          <div className="grid gap-4">
            {organizations.map((organization) => (
              <Card key={organization._id} className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-ink"><bdi>{organization.companyName}</bdi></h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
                    <span>الممثل: <bdi className="font-medium text-ink">{organization.name}</bdi></span>
                    <span>البريد: <bdi dir="ltr" className="font-medium text-ink">{organization.email}</bdi></span>
                    <span>الهاتف: <bdi className="tabular-nums font-medium text-ink" dir="ltr">{organization.phoneNumber}</bdi></span>
                  </div>
                  <div className="pt-2">
                    <a
                      href={organization.proofDocumentUrl?.startsWith('http') ? organization.proofDocumentUrl : `${API_ORIGIN}${organization.proofDocumentUrl || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      عرض مستند الإثبات
                    </a>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 border-t border-border pt-4 sm:border-t-0 sm:pt-0">
                  <Button variant="primary" onClick={() => setConfirmingOrgApprove(organization)} disabled={isSubmitting}>موافقة</Button>
                  <Button variant="danger" onClick={() => setConfirmingOrgReject(organization)} disabled={isSubmitting}>رفض</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pending Auctions Section */}
      <section className="mb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">المزادات بانتظار الاعتماد</h2>
          <Link to="/auctions" className="text-sm font-medium text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">عرض جميع المزادات</Link>
        </div>

        {isLoadingAuctions ? (
          <div className="py-12"><Spinner label="جاري تحميل المزادات المعلّقة..." /></div>
        ) : auctionError ? (
          <ErrorState message={auctionError} onRetry={fetchPendingAuctions} />
        ) : pendingAuctions.length === 0 ? (
          <EmptyState message="لا توجد مزادات بانتظار الاعتماد" />
        ) : (
          <div className="grid gap-4">
            {pendingAuctions.map((auction) => (
              <Card key={auction._id} className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-ink"><bdi>{auction.title}</bdi></h3>
                    <StatusStamp status={auction.status} label={getStatusLabel(auction.status)} />
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary line-clamp-2 max-w-3xl">{auction.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary pt-1">
                    <span>المعلن: <bdi className="font-medium text-ink">{auction.createdBy?.companyName || auction.createdBy?.name}</bdi></span>
                    <span>السعر الافتتاحي: <bdi className="tabular-nums font-medium text-ink" dir="ltr">{formatMoney(auction.startingPrice)}</bdi></span>
                  </div>
                </div>
                <div className="shrink-0 border-t border-border pt-4 sm:border-t-0 sm:pt-0">
                  <Button variant="primary" onClick={() => setConfirmingAuctionApprove(auction)} disabled={isSubmitting} className="w-full sm:w-auto justify-center">اعتماد المزاد</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!confirmingOrgApprove}
        title="اعتماد حساب المؤسسة"
        message={`هل أنت متأكد من اعتماد حساب مؤسسة "${confirmingOrgApprove?.companyName}"؟ سيمنحهم هذا صلاحية طرح العطاءات والمشاركة في المزادات.`}
        confirmLabel={isSubmitting ? "جاري الاعتماد..." : "اعتماد"}
        onConfirm={handleApproveOrganization}
        onCancel={() => !isSubmitting && setConfirmingOrgApprove(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmingAuctionApprove}
        title="اعتماد المزاد للنشر"
        message={`هل أنت متأكد من اعتماد مزاد "${confirmingAuctionApprove?.title}"؟ سيتم نشره فوراً للمزايدة العامة.`}
        confirmLabel={isSubmitting ? "جاري الاعتماد..." : "اعتماد ونشر"}
        onConfirm={handleApproveAuction}
        onCancel={() => !isSubmitting && setConfirmingAuctionApprove(null)}
      />

      {/* Custom Dialog for Rejection (Needs Reason Input) */}
      {!!confirmingOrgReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setConfirmingOrgReject(null)} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title">
            <h2 id="reject-dialog-title" className="mb-2 text-lg font-bold text-ink">رفض طلب المؤسسة</h2>
            <p className="mb-4 text-sm text-text-secondary">
              سيتم رفض طلب "{confirmingOrgReject.companyName}" وإرسال إشعار بريد إلكتروني بذلك.
            </p>

            <form onSubmit={handleRejectOrganization}>
              <div className="mb-6">
                <label htmlFor="rejectionReason" className="mb-1.5 block text-sm font-medium text-ink">سبب الرفض (اختياري)</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus-visible:outline-1 focus-visible:outline-registry-green placeholder:text-text-secondary/60"
                  placeholder="مثال: مستند السجل التجاري غير واضح..."
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setConfirmingOrgReject(null)} disabled={isSubmitting}>إلغاء</Button>
                <Button type="submit" variant="danger" disabled={isSubmitting}>{isSubmitting ? 'جارٍ الرفض...' : 'تأكيد الرفض'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
