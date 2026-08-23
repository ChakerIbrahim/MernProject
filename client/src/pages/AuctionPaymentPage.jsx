import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import DataRail from "../components/DataRail";
import ErrorState from "../components/ErrorState";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { useAuth } from "../functions/authContext";
import { formatCurrency, formatDate } from "../functions/tenders";

/**
 * FR-14.5 — the simulated payment confirmation for a won auction.
 *
 * No payment is processed and no gateway is contacted: a real one is out of
 * scope for the MVP (SRS §1.2, L-7). The screen says so in Arabic, twice,
 * because a screen that looks like checkout and is not must never be mistaken
 * for one.
 */
const AuctionPaymentPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAuction = async () => {
      try {
        const res = await api.get(`/api/auctions/${id}`);
        if (cancelled) return;
        setAuction(res.data.auction);
        setError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAuction();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <Spinner label="جاري تحميل بيانات المزاد…" />;

  if (error || !auction) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <ErrorState message={error || "تعذّر تحميل المزاد."} />
      </main>
    );
  }

  const isWinner =
    auction.status === "ended" &&
    user &&
    String(auction.currentHighestBidder?._id ?? auction.currentHighestBidder ?? "") ===
      String(user._id);

  if (!isWinner) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <PageHeading title="إتمام الدفع" />
        <div className="rounded-card border border-border bg-surface p-4 sm:p-6">
          <p className="text-sm leading-7 text-text-secondary">
            هذه الصفحة متاحة للفائز بالمزاد بعد انتهائه فقط.
          </p>
          <p className="mt-4 text-sm">
            <Link
              to={`/auctions/${id}`}
              className="text-registry-green underline underline-offset-4"
            >
              العودة إلى المزاد
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <PageHeading title="إتمام الدفع" description={auction.title} />

      {/* Said up front, before anything that resembles a payment control. */}
      <p
        role="status"
        className="mb-6 rounded-field border border-warning bg-surface px-3 py-2 text-sm leading-7 text-warning"
      >
        هذه شاشة محاكاة للدفع ضمن النسخة التجريبية من المنصة. لا تتم أي عملية دفع
        حقيقية، ولا يُطلب منك إدخال أي بيانات بنكية.
      </p>

      <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
        {isConfirmed ? (
          <>
            <h2 className="mb-3 font-display text-lg text-registry-green">
              تم تأكيد العملية (محاكاة)
            </h2>
            <p className="mb-4 text-sm leading-7 text-text-secondary">
              تم تسجيل تأكيدك لهذه المحاكاة. لم يُخصم أي مبلغ، ولم تُنفَّذ أي عملية
              دفع فعلية. في النسخة النهائية ستُستبدل هذه الخطوة ببوابة دفع حقيقية.
            </p>
            <Link to="/my-auctions">
              <Button>العودة إلى مزاداتي</Button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="mb-4 font-display text-lg text-ink">تفاصيل الفوز</h2>

            <DataRail
              items={[
                { label: "المزاد", value: <bdi>{auction.title}</bdi> },
                {
                  label: "المبلغ المستحق",
                  value: (
                    <bdi className="font-display tabular-nums" dir="ltr">
                      {formatCurrency(auction.currentPrice)}
                    </bdi>
                  ),
                },
                { label: "تاريخ الإغلاق", value: formatDate(auction.endsAt) },
              ]}
            />

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => setIsConfirmed(true)}>
                تأكيد الدفع (محاكاة)
              </Button>
              <Link to={`/auctions/${id}`}>
                <Button variant="secondary">العودة إلى المزاد</Button>
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default AuctionPaymentPage;
