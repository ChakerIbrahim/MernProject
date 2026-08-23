import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LogoutButton from "../components/LogoutButton";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import StatusStamp from "../components/StatusStamp";
import AuctionCard from "../components/AuctionCard";
import MyProposalsList from "../components/MyProposalsList";
import TenderCard from "../components/TenderCard";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { useAuth } from "../functions/authContext";
import { isApprovedOrganization } from "../functions/roles";

/**
 * FR-3.4 / FR-1.5 — a pending organization may sign in, sees an
 * awaiting-review notice, and is given no route to tender creation. The server
 * refuses the action independently (FR-6.3).
 */
const OrganizationDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreateTender = isApprovedOrganization(user);

  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(canCreateTender);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [closingId, setClosingId] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [auctions, setAuctions] = useState([]);
  const [auctionsError, setAuctionsError] = useState("");
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    if (!canCreateTender) return undefined;
    let cancelled = false;

    const loadMyTenders = async () => {
      try {
        const [tenderRes, auctionRes, proposalRes] = await Promise.all([
          api.get("/api/tenders?mine=true"),
          api.get("/api/auctions?mine=true"),
          api.get("/api/proposals"),
        ]);
        if (cancelled) return;
        setTenders(tenderRes.data.tenders);
        setAuctions(auctionRes.data.auctions);
        setProposals(proposalRes.data.proposals);
        setError("");
        setAuctionsError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadMyTenders();
    return () => {
      cancelled = true;
    };
  }, [canCreateTender, reloadToken]);

  const handleClose = async (tenderId) => {
    setClosingId(tenderId);
    setActionError("");
    try {
      await api.delete(`/api/tenders/${tenderId}`);
      setConfirmingId("");
      setReloadToken((token) => token + 1);
    } catch (err) {
      setActionError(readFormError(err));
    } finally {
      setClosingId("");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="لوحة تحكم المؤسسة"
        description={user?.companyName ?? user?.name ?? ""}
        actions={<LogoutButton />}
      />

      <section className="mb-6 rounded-card border border-border bg-surface p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg text-ink">حالة الحساب</h2>
          <StatusStamp entity="organization" status={user?.status} />
        </div>

        {user?.status === "pending" ? (
          <p className="text-sm leading-7 text-text-secondary">
            حسابك قيد المراجعة من فريق الإدارة. سيتم إشعارك بالبريد الإلكتروني فور
            اتخاذ القرار، ولا يمكن نشر العطاءات أو تقديم العروض قبل الموافقة.
          </p>
        ) : null}

        {user?.status === "rejected" ? (
          <p className="text-sm leading-7 text-text-secondary">
            لم تتم الموافقة على حساب المؤسسة. راجع البيانات المقدَّمة وتواصل مع
            الإدارة لمعرفة التفاصيل.
          </p>
        ) : null}

        {canCreateTender ? (
          <p className="text-sm leading-7 text-text-secondary">
            تمت الموافقة على حسابك. يمكنك نشر العطاءات وتصفّح العطاءات المتاحة.
          </p>
        ) : null}
      </section>

      {canCreateTender ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-ink">عطاءاتي</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/tenders">
                <Button variant="secondary">تصفّح العطاءات</Button>
              </Link>
              <Link to="/tenders/new">
                <Button>نشر عطاء جديد</Button>
              </Link>
            </div>
          </div>

          {actionError ? (
            <p
              role="alert"
              className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
            >
              {actionError}
            </p>
          ) : null}

          {isLoading ? <Spinner label="جاري تحميل عطاءاتك…" /> : null}

          {!isLoading && error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                setIsLoading(true);
                setReloadToken((token) => token + 1);
              }}
            />
          ) : null}

          {!isLoading && !error && !tenders.length ? (
            <EmptyState
              message="لم تنشر أي عطاء بعد."
              actionLabel="نشر عطاء جديد"
              onAction={() => navigate("/tenders/new")}
            />
          ) : null}

          {!isLoading && !error && tenders.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tenders.map((tender) => (
                <TenderCard
                  key={tender._id}
                  tender={tender}
                  actions={
                    tender.status !== "open" ? null : confirmingId === tender._id ? (
                      // NFR-U4: closing is destructive, so it takes a confirm step.
                      <>
                        <span className="w-full text-sm text-ink">
                          سيتم إغلاق العطاء ولن يقبل عروضاً جديدة. تأكيد؟
                        </span>
                        <Button
                          variant="danger"
                          onClick={() => handleClose(tender._id)}
                          isLoading={closingId === tender._id}
                        >
                          تأكيد الإغلاق
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmingId("")}
                          disabled={closingId === tender._id}
                        >
                          إلغاء
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/tenders/${tender._id}/edit`)}
                        >
                          تعديل
                        </Button>
                        <Button variant="danger" onClick={() => setConfirmingId(tender._id)}>
                          إغلاق
                        </Button>
                      </>
                    )
                  }
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {canCreateTender ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-ink">عروضي المقدَّمة</h2>
            <Link to="/tenders">
              <Button variant="secondary">تصفّح العطاءات</Button>
            </Link>
          </div>

          {isLoading ? <Spinner label="جاري تحميل عروضك…" /> : null}
          {!isLoading && !error ? <MyProposalsList proposals={proposals} /> : null}
        </section>
      ) : null}

      {canCreateTender ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-ink">مزاداتي</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/auctions">
                <Button variant="secondary">تصفّح المزادات</Button>
              </Link>
              <Link to="/auctions/new">
                <Button>طرح مزاد جديد</Button>
              </Link>
            </div>
          </div>

          {auctionsError ? (
            <p
              role="alert"
              className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
            >
              {auctionsError}
            </p>
          ) : null}

          {!isLoading && !auctions.length ? (
            <EmptyState
              message="لم تطرح أي مزاد بعد."
              actionLabel="طرح مزاد جديد"
              onAction={() => navigate("/auctions/new")}
            />
          ) : null}

          {!isLoading && auctions.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {auctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
};

export default OrganizationDashboardPage;
