import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import ProposalReviewCard from "../components/ProposalReviewCard";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { notifyProposalAccepted, notifyProposalRejected } from "../functions/sendEmail";

/**
 * FR-11.1 / FR-11.2 — the tender owner (or an admin) reviews the proposals
 * submitted against one tender and accepts or rejects each one.
 *
 * FR-11.4: accepting one proposal deliberately leaves the others at
 * "submitted". Rejecting the rest is a separate, explicit action.
 */
const TenderProposalsPage = () => {
  const { id } = useParams();

  const [proposals, setProposals] = useState([]);
  const [tender, setTender] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [actionError, setActionError] = useState("");
  const [decidingId, setDecidingId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProposals = async () => {
      try {
        const [tenderRes, proposalsRes] = await Promise.all([
          api.get(`/api/tenders/${id}`),
          api.get(`/api/tenders/${id}/proposals`),
        ]);
        if (cancelled) return;
        setTender(tenderRes.data.tender);
        setProposals(proposalsRes.data.proposals);
        setError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProposals();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const handleDecide = async (proposalId, status) => {
    setDecidingId(proposalId);
    setActionError("");
    try {
      const res = await api.patch(`/api/proposals/${proposalId}/status`, { status });
      // Update this row in place; every other proposal is left untouched.
      setProposals((current) =>
        current.map((p) => (p._id === proposalId ? { ...p, ...res.data.proposal } : p))
      );

      // FR-11.3 / FR-16.1 — after the decision is persisted and the UI has it.
      // NFR-R2: a failed send never rolls the decision back.
      const decided = res.data.proposal;
      if (status === "accepted") notifyProposalAccepted(decided, tender?.title);
      else notifyProposalRejected(decided, tender?.title);
    } catch (err) {
      setActionError(readFormError(err));
    } finally {
      setDecidingId("");
    }
  };

  const retry = () => {
    setIsLoading(true);
    setError("");
    setReloadToken((token) => token + 1);
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="العروض المقدَّمة"
        description={tender ? tender.title : "مراجعة العروض المقدَّمة على العطاء."}
      />

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
        >
          {actionError}
        </p>
      ) : null}

      {isLoading ? <Spinner label="جاري تحميل العروض…" /> : null}

      {!isLoading && error ? <ErrorState message={error} onRetry={retry} /> : null}

      {!isLoading && !error && !proposals.length ? (
        <EmptyState message="لم يتم تقديم أي عروض على هذا العطاء بعد." />
      ) : null}

      {!isLoading && !error && proposals.length ? (
        <div className="flex flex-col gap-4">
          {proposals.map((proposal) => (
            <ProposalReviewCard
              key={proposal._id}
              proposal={proposal}
              onDecide={handleDecide}
              isBusy={decidingId === proposal._id}
            />
          ))}
        </div>
      ) : null}

      <p className="mt-6 text-sm">
        <Link to={`/tenders/${id}`} className="text-registry-green underline underline-offset-4">
          العودة إلى تفاصيل العطاء
        </Link>
      </p>
    </main>
  );
};

export default TenderProposalsPage;
