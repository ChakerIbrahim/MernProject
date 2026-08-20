import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LogoutButton from "../components/LogoutButton";
import PageHeading from "../components/PageHeading";
import PendingOrganizationCard from "../components/PendingOrganizationCard";
import Spinner from "../components/Spinner";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";

/** FR-4 — the admin review queue. */
const AdminDashboardPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [reloadToken, setReloadToken] = useState(0);

  // The fetch lives inside the effect and bumps `reloadToken` to run again, so
  // no state is set synchronously on mount and the in-flight request is
  // cancelled if the admin navigates away mid-load (react-component skill §5).
  useEffect(() => {
    let cancelled = false;

    const loadPending = async () => {
      try {
        const res = await api.get("/api/admin/organizations/pending");
        if (cancelled) return;
        setOrganizations(res.data.organizations);
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

  /**
   * Removes the card straight away, then puts it back at its original position
   * if the server refuses. No full refetch on success.
   */
  const decide = async (id, request) => {
    const index = organizations.findIndex((org) => org._id === id);
    const removed = organizations[index];
    if (!removed) return;

    setBusyId(id);
    setActionError("");
    setOrganizations(organizations.filter((org) => org._id !== id));

    try {
      await request();
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
    decide(id, () => api.patch(`/api/admin/organizations/${id}/approve`));

  const handleReject = (id, reason) =>
    decide(id, () => api.patch(`/api/admin/organizations/${id}/reject`, { reason }));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="طلبات تسجيل المؤسسات"
        description="مراجعة حسابات المؤسسات قيد الانتظار قبل تفعيلها."
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
    </main>
  );
};

export default AdminDashboardPage;
