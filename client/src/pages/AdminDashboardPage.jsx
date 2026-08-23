import { useEffect, useState } from "react";
import AuctionCard from "../components/AuctionCard";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LogoutButton from "../components/LogoutButton";
import PageHeading from "../components/PageHeading";
import PendingOrganizationCard from "../components/PendingOrganizationCard";
import Spinner from "../components/Spinner";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import {
  notifyOrganizationApproved,
  notifyOrganizationRejected,
} from "../functions/sendEmail";

/** FR-4 — the admin review queue. */
const AdminDashboardPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [reloadToken, setReloadToken] = useState(0);
  const [auctions, setAuctions] = useState([]);
  const [approvingId, setApprovingId] = useState("");

  // The fetch lives inside the effect and bumps `reloadToken` to run again, so
  // no state is set synchronously on mount and the in-flight request is
  // cancelled if the admin navigates away mid-load (react-component skill §5).
  useEffect(() => {
    let cancelled = false;

    const loadPending = async () => {
      try {
        const [orgRes, auctionRes] = await Promise.all([
          api.get("/api/admin/organizations/pending"),
          api.get("/api/admin/auctions/pending"),
        ]);
        if (cancelled) return;
        setOrganizations(orgRes.data.organizations);
        setAuctions(auctionRes.data.auctions);
        setError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPending();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const retryLoad = () => {
    setIsLoading(true);
    setError("");
    setReloadToken((token) => token + 1);
  };

  /** FR-12.3 — approving publishes the auction to the public list. */
  const handleApproveAuction = async (auctionId) => {
    setApprovingId(auctionId);
    setActionError("");
    try {
      await api.patch(`/api/admin/auctions/${auctionId}/approve`);
      setAuctions((current) => current.filter((a) => a._id !== auctionId));
    } catch (err) {
      setActionError(readFormError(err));
    } finally {
      setApprovingId("");
    }
  };

  /**
   * Removes the card straight away, then puts it back at its original position
   * if the server refuses. No full refetch on success.
   */
  const decide = async (id, request, notify) => {
    const index = organizations.findIndex((org) => org._id === id);
    const removed = organizations[index];
    if (!removed) return;

    setBusyId(id);
    setActionError("");
    setOrganizations(organizations.filter((org) => org._id !== id));

    try {
      const res = await request();

      // FR-16.1 / NFR-R2 — the decision is already persisted. The email is
      // fired after, never awaited into the success path, and its failure is
      // swallowed inside the helper: a bounced notice must not un-approve an
      // organization.
      notify?.(res?.data?.organization ?? removed);
    } catch (err) {
      const restored = organizations.filter((org) => org._id !== id);
      restored.splice(index, 0, removed);
      setOrganizations(restored);
      setActionError(readFormError(err));
    } finally {
      setBusyId("");
    }
  };

  const handleApprove = (id) =>
    decide(
      id,
      () => api.patch(`/api/admin/organizations/${id}/approve`),
      (organization) => notifyOrganizationApproved(organization)
    );

  const handleReject = (id, reason) =>
    decide(
      id,
      () => api.patch(`/api/admin/organizations/${id}/reject`, { reason }),
      (organization) => notifyOrganizationRejected(organization, reason)
    );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="لوحة تحكم الإدارة"
        description="مراجعة حسابات المؤسسات والمزادات قيد الانتظار."
        actions={<LogoutButton />}
      />

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
        >
          {actionError}
        </p>
      ) : null}

      <h2 className="mb-4 font-display text-lg text-ink">طلبات تسجيل المؤسسات</h2>

      {isLoading ? <Spinner label="جاري تحميل الطلبات…" /> : null}

      {!isLoading && error ? <ErrorState message={error} onRetry={retryLoad} /> : null}

      {!isLoading && !error && !organizations.length ? (
        <EmptyState message="لا توجد طلبات قيد المراجعة." />
      ) : null}

      {!isLoading && !error && organizations.length ? (
        <div className="flex flex-col gap-4">
          {organizations.map((organization) => (
            <PendingOrganizationCard
              key={organization._id}
              organization={organization}
              onApprove={handleApprove}
              onReject={handleReject}
              isBusy={busyId === organization._id}
            />
          ))}
        </div>
      ) : null}

      <h2 className="mb-4 mt-10 font-display text-lg text-ink">مزادات بانتظار الموافقة</h2>

      {!isLoading && !error && !auctions.length ? (
        <EmptyState message="لا توجد مزادات بانتظار الموافقة." />
      ) : null}

      {!isLoading && !error && auctions.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {auctions.map((auction) => (
            <AuctionCard
              key={auction._id}
              auction={auction}
              actions={
                <Button
                  onClick={() => handleApproveAuction(auction._id)}
                  isLoading={approvingId === auction._id}
                >
                  اعتماد المزاد
                </Button>
              }
            />
          ))}
        </div>
      ) : null}
    </main>
  );
};

export default AdminDashboardPage;
