import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LogoutButton from "../components/LogoutButton";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { OUTCOME_LABELS, OUTCOME_TONES } from "../functions/auctions";
import { formatCurrency, formatDate } from "../functions/tenders";

/**
 * FR-14.4 — the individual's own auction history: what they bid, and how each
 * one turned out across the four outcomes.
 */
const MyAuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadMine = async () => {
      try {
        const res = await api.get("/api/users/me/auctions");
        if (cancelled) return;
        setAuctions(res.data.auctions);
        setError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadMine();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="مزاداتي"
        description="المزادات التي شاركت فيها ونتيجة كل منها."
        actions={<LogoutButton />}
      />

      {isLoading ? <Spinner label="جاري تحميل مزاداتك…" /> : null}

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
        <EmptyState message="لم تشارك في أي مزاد بعد." />
      ) : null}

      {!isLoading && !error && auctions.length ? (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="px-4 py-3 text-start font-medium">المزاد</th>
                <th className="px-4 py-3 text-start font-medium">مزايدتك</th>
                <th className="px-4 py-3 text-start font-medium">السعر الحالي</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((auction) => (
                <tr key={auction._id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/auctions/${auction._id}`}
                      className="text-registry-green underline underline-offset-4"
                    >
                      <bdi>{auction.title}</bdi>
                    </Link>
                    <span className="block text-xs text-text-secondary">
                      {formatDate(auction.endsAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <bdi className="tabular-nums text-ink" dir="ltr">
                      {formatCurrency(auction.myHighestBid)}
                    </bdi>
                  </td>
                  <td className="px-4 py-3">
                    <bdi className="tabular-nums text-ink" dir="ltr">
                      {formatCurrency(auction.currentPrice)}
                    </bdi>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-control border bg-surface px-2.5 py-1 text-xs font-medium ${OUTCOME_TONES[auction.outcome]}`}
                    >
                      {OUTCOME_LABELS[auction.outcome]}
                    </span>
                    {auction.outcome === "won" ? (
                      <Link
                        to={`/auctions/${auction._id}/payment`}
                        className="mt-1 block text-xs text-registry-green underline underline-offset-4"
                      >
                        إتمام الدفع
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
};

export default MyAuctionsPage;
