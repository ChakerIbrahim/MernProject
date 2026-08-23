import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import DataRail from "../components/DataRail";
import ErrorState from "../components/ErrorState";
import PageHeading from "../components/PageHeading";
import ProposalSection from "../components/ProposalSection";
import Spinner from "../components/Spinner";
import StatusStamp from "../components/StatusStamp";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { useAuth } from "../functions/authContext";
import { isApprovedOrganization } from "../functions/roles";
import { formatCurrency, formatDate } from "../functions/tenders";

/** FR-7.3 — tender details, with owner controls and the proposal form (FR-9). */
const TenderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tender, setTender] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadTender = async () => {
      try {
        const res = await api.get(`/api/tenders/${id}`);
        if (cancelled) return;
        setTender(res.data.tender);
        setError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTender();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  // Presentation only. The server refuses each of these independently (FR-5.5).
  const isOwner = Boolean(tender && user && tender.createdBy?._id === user._id);
  const isAdmin = user?.role === "admin";
  const isOrganization = user?.role === "organization";
  const isOpen = tender?.status === "open";

  const handleClose = async () => {
    setIsClosing(true);
    setActionError("");
    try {
      await api.delete(`/api/tenders/${id}`);
      setIsConfirmingClose(false);
      setIsLoading(true);
      setReloadToken((token) => token + 1);
    } catch (err) {
      setActionError(readFormError(err));
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) return <Spinner label="جاري تحميل العطاء…" />;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <ErrorState message={error} onRetry={() => setReloadToken((t) => t + 1)} />
        <p className="mt-4">
          <Link to="/tenders" className="text-registry-green underline underline-offset-4">
            العودة إلى قائمة العطاءات
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title={tender.title}
        actions={
          <>
            {isOwner && isOpen ? (
              <Button variant="secondary" onClick={() => navigate(`/tenders/${id}/edit`)}>
                تعديل
              </Button>
            ) : null}
            {(isOwner || isAdmin) && isOpen ? (
              <Button variant="danger" onClick={() => setIsConfirmingClose(true)}>
                إغلاق العطاء
              </Button>
            ) : null}
          </>
        }
      />

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
        >
          {actionError}
        </p>
      ) : null}

      {isConfirmingClose ? (
        <div className="mb-6 rounded-card border border-error bg-surface p-4">
          <p className="mb-3 text-sm text-ink">
            سيتم إغلاق هذا العطاء ولن يقبل عروضاً جديدة. هل تريد المتابعة؟
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={handleClose} isLoading={isClosing}>
              تأكيد الإغلاق
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsConfirmingClose(false)}
              disabled={isClosing}
            >
              إلغاء
            </Button>
          </div>
        </div>
      ) : null}

      <section className="mb-6 rounded-card border border-border bg-surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg text-ink">تفاصيل العطاء</h2>
          <StatusStamp entity="tender" status={tender.status} />
        </div>

        <p className="mb-6 whitespace-pre-line text-sm leading-7 text-ink">
          {tender.description}
        </p>

        <DataRail
          items={[
            { label: "الجهة", value: <bdi>{tender.createdBy?.companyName ?? "—"}</bdi> },
            { label: "الفئة", value: tender.category },
            {
              label: "الميزانية التقديرية",
              value: <bdi className="tabular-nums">{formatCurrency(tender.budgetEstimate)}</bdi>,
            },
            { label: "الموعد النهائي", value: formatDate(tender.deadline) },
            { label: "تاريخ النشر", value: formatDate(tender.createdAt) },
          ]}
        />
      </section>

      {/* The owner reviews proposals instead of submitting one (FR-11.1). */}
      {isOwner || isAdmin ? (
        <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
          <h2 className="mb-3 font-display text-lg text-ink">العروض المقدَّمة</h2>
          <p className="mb-4 text-sm text-text-secondary">
            اطّلع على العروض المقدَّمة على هذا العطاء.
          </p>
          <Link to={`/tenders/${id}/proposals`}>
            <Button>مراجعة العروض</Button>
          </Link>
        </section>
      ) : null}

      {/* FR-9.1 — hidden entirely for individuals and for the owner of the
          tender. key={id} remounts the flow when moving between tenders, so
          no proposal state leaks from one tender to the next. */}
      {isOrganization && !isOwner ? (
        <ProposalSection
          key={id}
          tenderId={id}
          isApproved={isApprovedOrganization(user)}
          isOpen={isOpen}
        />
      ) : null}

      <p className="mt-6 text-sm">
        <Link to="/tenders" className="text-registry-green underline underline-offset-4">
          العودة إلى قائمة العطاءات
        </Link>
      </p>
    </main>
  );
};

export default TenderDetailPage;
