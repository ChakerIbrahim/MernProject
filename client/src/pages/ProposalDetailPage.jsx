/**
 * Proposal details page.
 * Loads one proposal and shows its related tender, submitter, price, status, and document.
 * It also decides whether the current user may open the associated conversation.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import api from '../functions/api';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import Button from '../components/Button';
import StatusStamp from '../components/StatusStamp';
import { formatMoney, getStatusLabel, formatDate } from '../functions/formatters';
import Card from '../components/Card';
import Icon from '../components/Icon';
import { API_ORIGIN } from '../functions/backendUrl';

/**
 * Returns the ID from either a populated object or a plain ID value.
 * @param {object|string|null} entity - Mongoose-style object or ID.
 * @returns {string|undefined} The usable entity ID.
 */
const getEntityId = (entity) => entity?._id || entity?.id || entity;

/**
 * Builds the proposal details page.
 * @returns {JSX.Element} Loading, error, or proposal details content.
 */
export default function ProposalDetailPage() {
  // Proposal ID read from the URL.
  const { id } = useParams();
  // Router action used to open the negotiation page.
  const navigate = useNavigate();
  // Authenticated user used for owner and submitter checks.
  const { user } = useAuth();
  // Proposal data loaded from the server.
  const [proposal, setProposal] = useState(null);
  // Controls the initial loading spinner.
  const [isLoading, setIsLoading] = useState(true);
  // User-facing loading error.
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    /**
     * Loads the proposal identified by the route parameter.
     * @returns {Promise<void>} Updates proposal or error state.
     * @throws {Error} The Axios error is caught and shown in the page error state.
     */
    const loadProposal = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/proposals/${id}`);
        if (isMounted) setProposal(response.data.proposal);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'تعذّر تحميل تفاصيل العرض.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProposal();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <div className="py-16"><Spinner label="جاري تحميل تفاصيل العرض..." /></div>;
  }

  if (error || !proposal) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <ErrorState message={error || 'لم يتم العثور على العرض.'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Related tender and the IDs used to determine the current user's access.
  const tender = proposal.tender;
  const tenderOwnerId = getEntityId(tender?.createdBy);
  const submitterId = getEntityId(proposal.submittedBy);
  const isOwner = String(tenderOwnerId) === String(getEntityId(user));
  const isSubmitter = String(submitterId) === String(getEntityId(user));
  // Chat is available only to the tender owner or submitter after acceptance.
  const canOpenChat = proposal.status === 'accepted' && (isOwner || isSubmitter);
  // Absolute URL used to open the uploaded proposal document.
  const documentUrl = proposal.documentUrl?.startsWith('http')
    ? proposal.documentUrl
    : `${API_ORIGIN}${proposal.documentUrl || ''}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/org/proposals" className="inline-flex items-center gap-2 text-sm font-semibold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">
          <span aria-hidden="true">→</span>
          العودة إلى العروض
        </Link>
        {canOpenChat ? (
          <Button type="button" variant="primary" onClick={() => navigate(`/proposals/${proposal._id}/negotiation`)}>
            <Icon name="chat" className="h-4 w-4" />
            فتح المحادثة
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeading title="تفاصيل العرض" />
          <p className="mt-2 text-sm leading-7 text-text-secondary">راجع بيانات العرض والعطاء المرتبط به من مكان واحد.</p>
        </div>
        <StatusStamp status={proposal.status} label={getStatusLabel(proposal.status)} />
      </div>

      <Card className="space-y-6 p-5 sm:p-7">
        <section className="border-b border-border pb-6">
          <p className="mb-2 text-xs font-semibold text-text-secondary">العطاء المرتبط</p>
          <Link to={`/tenders/${tender?._id}`} className="font-display text-xl font-bold leading-relaxed text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green">
            <bdi>{tender?.title || 'عطاء غير متوفر'}</bdi>
          </Link>
          <p className="mt-3 text-sm text-text-secondary">
            الجهة الطارحة: <bdi className="font-semibold text-ink">{tender?.createdBy?.companyName || tender?.createdBy?.name || 'غير متوفر'}</bdi>
          </p>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-ink">بيانات العرض</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-paper p-4">
              <p className="text-xs font-semibold text-text-secondary">مقدم العرض</p>
              <p className="mt-2 font-bold text-ink"><bdi>{proposal.submittedBy?.companyName || proposal.submittedBy?.name || 'غير متوفر'}</bdi></p>
            </div>
            <div className="rounded-xl border border-border bg-paper p-4">
              <p className="text-xs font-semibold text-text-secondary">السعر النهائي</p>
              <p className="mt-2 font-bold tabular-nums text-ink" dir="ltr">{formatMoney(proposal.finalPrice)}</p>
            </div>
            <div className="rounded-xl border border-border bg-paper p-4">
              <p className="text-xs font-semibold text-text-secondary">حالة العرض</p>
              <div className="mt-2"><StatusStamp status={proposal.status} label={getStatusLabel(proposal.status)} /></div>
            </div>
            <div className="rounded-xl border border-border bg-paper p-4">
              <p className="text-xs font-semibold text-text-secondary">تاريخ التقديم</p>
              <p className="mt-2 font-semibold text-ink tabular-nums" dir="ltr">
                {formatDate(proposal.createdAt)}
              </p>
            </div>
          </div>
        </section>

        {proposal.documentUrl ? (
          <section className="border-t border-border pt-6">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">مستند العرض</h2>
            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-registry-green hover:border-registry-green hover:bg-registry-green/5 focus-visible:outline-1 focus-visible:outline-registry-green">
              <Icon name="document" className="h-5 w-5" />
              فتح مستند العرض
            </a>
          </section>
        ) : null}

        {proposal.aiExtractedData?.summary ? (
          <section className="border-t border-border pt-6">
            <h2 className="mb-3 font-display text-lg font-bold text-ink">ملخص العرض</h2>
            <p className="rounded-xl border border-border bg-paper p-4 text-sm leading-8 text-ink">{proposal.aiExtractedData.summary}</p>
          </section>
        ) : null}

        {!canOpenChat && proposal.status !== 'accepted' ? (
          <p className="border-t border-border pt-5 text-sm text-text-secondary">ستصبح المحادثة متاحة للطرفين بعد قبول العرض.</p>
        ) : null}
      </Card>
    </div>
  );
}
