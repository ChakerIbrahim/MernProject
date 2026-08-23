import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuctionCard from "../components/AuctionCard";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { useAuth } from "../functions/authContext";
import { isApprovedOrganization } from "../functions/roles";

/**
 * FR-12.4 — public. Reachable with no session at all; the server returns only
 * active auctions, so a pending listing never reaches this page.
 */
const AuctionListPage = () => {
  const { user } = useAuth();

  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAuctions = async () => {
      try {
        const res = await api.get("/api/auctions");
        if (cancelled) return;
        setAuctions(res.data.auctions);
        setError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAuctions();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const canCreate = isApprovedOrganization(user) || user?.role === "admin";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="المزادات النشطة"
        description="تصفّح المزادات المتاحة حالياً. المزايدة متاحة للأفراد المسجّلين."
        actions={
          canCreate ? (
            <Link to="/auctions/new">
              <Button>طرح مزاد جديد</Button>
            </Link>
          ) : null
        }
      />

      {isLoading ? <Spinner label="جاري تحميل المزادات…" /> : null}

      {!isLoading && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setIsLoading(true);
            setReloadToken((token) => token + 1);
          }}
        />
      ) : null}

      {!isLoading && !error && !auctions.length ? (
        <EmptyState message="لا توجد مزادات نشطة حالياً." />
      ) : null}

      {!isLoading && !error && auctions.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {auctions.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} />
          ))}
        </div>
      ) : null}
    </main>
  );
};

export default AuctionListPage;
