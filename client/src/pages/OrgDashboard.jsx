/**
 * Organization dashboard page.
 * Shows the organization's current tenders, proposals, auctions, counts, and activity.
 * The page reads data from the dashboard hook and returns the correct loading, error,
 * approval, empty, and success UI states without inventing dashboard data.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useOrgDashboard } from '../hooks/useOrgDashboard';
import { formatDate, formatMoney, getStatusLabel } from '../functions/formatters';
import OrganizationApprovalState from '../components/dashboard/OrganizationApprovalState';
import StatusStamp from '../components/StatusStamp';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';
import Icon from '../components/Icon';
import { API_ORIGIN } from '../functions/backendUrl';

/**
 * Wraps dashboard content in the shared card style.
 * @param {object} props - Child elements, optional CSS classes, and Card props.
 * @returns {JSX.Element} A styled card containing the supplied children.
 */
function BentoCard({ children, className = '', ...props }) {
  return <Card className={`rounded-2xl border-border shadow-sm ${className}`} {...props}>{children}</Card>;
}

/**
 * Displays a dashboard section title and an optional link to the full section.
 * @param {string} icon - Icon name shown beside the title.
 * @param {string} title - Arabic section title.
 * @param {string} [to] - Optional route for the section link.
 * @param {string} [actionLabel] - Text used for the optional link.
 * @returns {JSX.Element} A heading row for one dashboard section.
 */
function SectionHeading({ icon, title, to, actionLabel = 'عرض الكل' }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-registry-green/10 text-registry-green">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      </div>
      {to ? <Link to={to} className="shrink-0 text-xs font-bold text-registry-green transition-colors hover:text-green-dark focus-visible:outline-1 focus-visible:outline-registry-green">{actionLabel} ←</Link> : null}
    </div>
  );
}

/**
 * Shows one key performance indicator in a reusable card.
 * @param {string} icon - Icon name for the metric.
 * @param {string} label - Description shown below the value.
 * @param {number|string} value - Metric value shown when loading is complete.
 * @param {string} [tone] - Color theme for the icon area.
 * @param {boolean} loading - Whether to show a placeholder instead of the value.
 * @returns {JSX.Element} A single KPI card.
 */
function KpiCard({ icon, label, value, tone = 'registry-green', loading }) {
  // Maps a friendly tone name to the CSS classes used by the icon area.
  const toneClasses = {
    'registry-green': 'bg-registry-green/10 text-registry-green',
    warning: 'bg-warning/10 text-warning',
    ink: 'bg-ink/5 text-ink',
    info: 'bg-info/10 text-info'
  };
  return (
    <BentoCard className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone] || toneClasses['registry-green']}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="font-display text-3xl font-bold leading-none tabular-nums text-ink">{loading ? '—' : value}</p>
      <p className="mt-2 text-xs font-medium text-text-secondary">{label}</p>
    </BentoCard>
  );
}

/**
 * Shows a short preview of one tender.
 * @param {object} tender - Tender data received from the dashboard API.
 * @returns {JSX.Element} A link containing the tender summary and status.
 */
function TenderPreview({ tender }) {
  return (
    <Link to={`/tenders/${tender._id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-paper/60 p-3 transition-colors hover:border-registry-green/30 hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink group-hover:text-registry-green"><bdi>{tender.title}</bdi></p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span>{tender.category || 'غير مصنف'}</span>
          <span>الموعد: <bdi dir="ltr">{formatDate(tender.deadline)}</bdi></span>
          {tender.budgetEstimate !== undefined && tender.budgetEstimate !== null ? <span><bdi dir="ltr">{formatMoney(tender.budgetEstimate)}</bdi></span> : null}
        </div>
      </div>
      <StatusStamp status={tender.status} label={getStatusLabel(tender.status)} />
    </Link>
  );
}

/**
 * Shows a short preview of one submitted proposal.
 * @param {object} proposal - Proposal data received from the dashboard API.
 * @returns {JSX.Element} A link containing proposal, price, and status information.
 */
function ProposalPreview({ proposal }) {
  return (
    <Link to={`/proposals/${proposal._id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-paper/60 p-3 transition-colors hover:border-registry-green/30 hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink group-hover:text-registry-green"><bdi>{proposal.tender?.title || 'عطاء غير متوفر'}</bdi></p>
        <p className="mt-1 truncate text-xs text-text-secondary">الجهة الطارحة: <bdi>{proposal.tender?.createdBy?.companyName || proposal.tender?.createdBy?.name || 'غير متوفر'}</bdi></p>
      </div>
      <div className="shrink-0 text-end">
        <p className="text-sm font-bold tabular-nums text-ink" dir="ltr">{formatMoney(proposal.finalPrice)}</p>
        <p className="mt-1 text-xs text-text-secondary">{getStatusLabel(proposal.status)}</p>
      </div>
    </Link>
  );
}

/**
 * Shows a short preview of one auction.
 * @param {object} auction - Auction data received from the dashboard API.
 * @returns {JSX.Element} A link containing auction title, price, image, and status.
 */
function AuctionPreview({ auction }) {
  return (
    <Link to={`/auctions/${auction._id}`} className="group flex items-center gap-3 rounded-xl border border-border bg-paper/50 p-3 transition-colors hover:border-registry-green/30 hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-registry-green/10 text-registry-green">
        {auction.imageUrl ? <img src={auction.imageUrl.startsWith('http') ? auction.imageUrl : `${API_ORIGIN}${auction.imageUrl}`} alt="" className="h-full w-full object-cover" /> : <Icon name="gavel" className="h-6 w-6" />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink group-hover:text-registry-green"><bdi>{auction.title}</bdi></p>
        <p className="mt-1 text-xs font-semibold text-text-secondary"><bdi dir="ltr">{formatMoney(auction.currentPrice || auction.startingPrice)}</bdi> · {getStatusLabel(auction.status)}</p>
      </div>
    </Link>
  );
}

/**
 * Builds the organization dashboard page.
 * It gets the signed-in user, loads dashboard data through useOrgDashboard,
 * derives small display-only counts, and returns the dashboard layout.
 * @returns {JSX.Element} The approval state or the complete organization dashboard.
 */
export default function OrgDashboard() {
  // The authenticated organization account used for greeting and permissions.
  const { user } = useAuth();
  // Dashboard data, loading flags, errors, and retry functions from the custom hook.
  const {
    tenders,
    auctions,
    proposals,
    isLoadingTenders,
    isLoadingAuctions,
    isLoadingProposals,
    isDashboardLoading,
    tenderError,
    auctionError,
    proposalError,
    fetchMyTenders,
    fetchMyAuctions,
    fetchMyProposals
  } = useOrgDashboard(user);

  if (user?.status !== 'approved') {
    return <OrganizationApprovalState user={user} />;
  }

  // The first three records shown in each dashboard preview section.
  const recentTenders = tenders.slice(0, 3);
  const recentProposals = proposals.slice(0, 3);
  const recentAuctions = auctions.slice(0, 3);

  // Display-only counts derived from the loaded arrays; they are not separate state.
  const openTenderCount = tenders.filter((tender) => tender.status === 'open').length;
  const activeAuctionCount = auctions.filter((auction) => auction.status === 'active').length;
  const pendingProposalCount = proposals.filter((proposal) => proposal.status === 'submitted' || proposal.status === 'under_review').length;

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* Welcome + primary actions */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12" aria-labelledby="dashboard-title">
        <div className="relative overflow-hidden rounded-2xl border border-registry-green/20 bg-gradient-to-l from-registry-green/10 via-surface to-surface p-6 shadow-sm sm:p-7 lg:col-span-8">
          <div className="absolute -end-12 -top-16 h-44 w-44 rounded-full bg-registry-green/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold text-registry-green">نظرة اليوم</p>
              <h1 id="dashboard-title" className="font-display text-xl font-bold leading-9 text-ink sm:text-2xl">مرحباً، <bdi>{user?.companyName || user?.name}</bdi></h1>
              <p className="mt-1 text-sm text-text-secondary">لديك <span className="font-bold text-registry-green">{isDashboardLoading ? '—' : proposals.length}</span> عروض مقدّمة في منصّة اعتماد.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link to="/tenders/new" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-registry-green px-4 py-2.5 text-sm font-bold text-surface shadow-sm transition-colors hover:bg-green-dark focus-visible:outline-1 focus-visible:outline-registry-green">
                <Icon name="document" className="h-4 w-4" />
                نشر عطاء
              </Link>
              <Link to="/auctions/new" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-paper focus-visible:outline-1 focus-visible:outline-registry-green">
                <Icon name="gavel" className="h-4 w-4 text-registry-green" />
                طرح مزاد
              </Link>
            </div>
          </div>
        </div>

        <BentoCard className="flex flex-col justify-center bg-success/5 p-6 lg:col-span-4">
          <p className="mb-1 text-xs font-bold text-success">عروض قيد المتابعة</p>
          <p className="font-display text-4xl font-bold leading-none tabular-nums text-ink">{isDashboardLoading ? '—' : pendingProposalCount}</p>
          <p className="mt-2 text-xs text-text-secondary">عروض مقدّمة تحتاج إلى متابعة حالتها.</p>
          <Link to="/org/proposals" className="mt-4 inline-flex w-max items-center gap-2 text-xs font-bold text-success hover:underline focus-visible:outline-1 focus-visible:outline-success">متابعة العروض <span aria-hidden="true">←</span></Link>
        </BentoCard>
      </section>

      {/* KPI Bento row */}
      <section aria-labelledby="dashboard-kpi-title">
        <h2 id="dashboard-kpi-title" className="sr-only">مؤشرات المؤسسة</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard icon="document" label="العطاءات المفتوحة" value={openTenderCount} loading={isDashboardLoading} tone="registry-green" />
          <KpiCard icon="arrow" label="عروضي المقدّمة" value={proposals.length} loading={isDashboardLoading} tone="warning" />
          <KpiCard icon="gavel" label="المزادات النشطة" value={activeAuctionCount} loading={isDashboardLoading} tone="ink" />
        </div>
      </section>

      {/* Main Bento content */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
        <BentoCard className="p-5 sm:p-6 lg:col-span-7">
          <SectionHeading icon="document" title="عطاءاتي" to="/org/tenders" />
          {isLoadingTenders ? <div className="py-8"><Spinner label="جاري تحميل عطاءاتك..." /></div> : tenderError ? <ErrorState message={tenderError} onRetry={fetchMyTenders} /> : recentTenders.length === 0 ? <EmptyState message="لم تنشر أي عطاء بعد" /> : <div className="space-y-3">{recentTenders.map((tender) => <TenderPreview key={tender._id} tender={tender} />)}{tenders.length > recentTenders.length ? <Link to="/org/tenders" className="block border-t border-border pt-3 text-center text-xs font-bold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">+ {tenders.length - recentTenders.length} عطاءات أخرى</Link> : null}</div>}
        </BentoCard>

        <BentoCard className="p-5 sm:p-6 lg:col-span-5">
          <SectionHeading icon="arrow" title="عروضي المقدّمة" to="/org/proposals" />
          {isLoadingProposals ? <div className="py-8"><Spinner label="جاري تحميل عروضك..." /></div> : proposalError ? <ErrorState message={proposalError} onRetry={fetchMyProposals} /> : recentProposals.length === 0 ? <EmptyState message="لم تقدّم أي عرض على عطاءات أخرى بعد" /> : <div className="space-y-3">{recentProposals.map((proposal) => <ProposalPreview key={proposal._id} proposal={proposal} />)}{proposals.length > recentProposals.length ? <Link to="/org/proposals" className="block border-t border-border pt-3 text-center text-xs font-bold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">+ {proposals.length - recentProposals.length} عروض أخرى</Link> : null}</div>}
        </BentoCard>

        <BentoCard className="p-5 sm:p-6 lg:col-span-12">
          <SectionHeading icon="gavel" title="مزاداتي" to="/auctions" />
          {isLoadingAuctions ? <div className="py-8"><Spinner label="جاري تحميل مزاداتك..." /></div> : auctionError ? <ErrorState message={auctionError} onRetry={fetchMyAuctions} /> : recentAuctions.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-paper/50 p-6 text-center"><Icon name="gavel" className="mx-auto mb-2 h-8 w-8 text-text-secondary" /><p className="text-sm text-text-secondary">لم تطرح أي مزادات بعد.</p><Link to="/auctions/new" className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-registry-green px-4 py-2 text-xs font-bold text-surface hover:bg-green-dark focus-visible:outline-1 focus-visible:outline-registry-green">طرح مزاد جديد</Link></div> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{recentAuctions.map((auction) => <AuctionPreview key={auction._id} auction={auction} />)}</div>}
        </BentoCard>

        {/* Real activity summary derived from loaded data; no fabricated events */}
        {(proposals.length > 0 || auctions.length > 0) ? <BentoCard className="p-5 sm:p-6 lg:col-span-12">
          <SectionHeading icon="bell" title="آخر التحديثات" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {proposals.slice(0, 3).map((proposal) => (
              <Link key={`proposal-${proposal._id}`} to={`/proposals/${proposal._id}`} className="flex items-start gap-3 rounded-xl border border-border bg-paper/50 p-3 transition-colors hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${proposal.status === 'accepted' ? 'bg-success/10 text-success' : proposal.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}><Icon name={proposal.status === 'accepted' ? 'check' : proposal.status === 'rejected' ? 'close' : 'clock'} className="h-4 w-4" /></span>
                <span className="min-w-0 text-sm text-ink"><span className="font-bold">{getStatusLabel(proposal.status)}</span> — <bdi className="break-words">{proposal.tender?.title || 'عرض مقدّم'}</bdi></span>
              </Link>
            ))}
            {auctions.filter((auction) => auction.status === 'pending_approval').slice(0, 2).map((auction) => (
              <Link key={`auction-${auction._id}`} to={`/auctions/${auction._id}`} className="flex items-start gap-3 rounded-xl border border-border bg-paper/50 p-3 transition-colors hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"><Icon name="clock" className="h-4 w-4" /></span>
                <span className="min-w-0 text-sm text-ink"><span className="font-bold">مزاد قيد المراجعة</span> — <bdi className="break-words">{auction.title}</bdi></span>
              </Link>
            ))}
          </div>
        </BentoCard> : null}
      </div>
    </div>
  );
}
