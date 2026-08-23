import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuctionCountdown from "../components/AuctionCountdown";
import BidSection from "../components/BidSection";
import DataRail from "../components/DataRail";
import ErrorState from "../components/ErrorState";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import StatusStamp from "../components/StatusStamp";
import api, { fileUrl } from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { useAuth } from "../functions/authContext";
import { POLL_INTERVAL_MS } from "../functions/auctions";
import { formatCurrency, formatDate } from "../functions/tenders";

const AuctionDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [priceFlash, setPriceFlash] = useState(false);

  /**
   * C-10 / NFR-P2 — polling, not websockets, every 4s: inside the 3-5s band.
   *
   * The cleanup returning clearInterval is the point. Without it the timer
   * outlives the page and keeps hitting the API forever, multiplying each time
   * the user navigates back in — the most common bug in this whole project.
   *
   * Polling also stops once the auction has ended; there is nothing left to
   * watch.
   */
  useEffect(() => {
    let cancelled = false;
    let timer;

    const loadAuction = async () => {
      try {
        const res = await api.get(`/api/auctions/${id}`);
        if (cancelled) return;

        setAuction((previous) => {
          if (previous && previous.currentPrice !== res.data.auction.currentPrice) {
            setPriceFlash(true);
            setTimeout(() => setPriceFlash(false), 800);
          }
          return res.data.auction;
        });
        setBids(res.data.bids ?? []);
        setError("");

        if (res.data.auction.status !== "active") {
          setIsLive(false);
          clearInterval(timer);
        }
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAuction();
    timer = setInterval(loadAuction, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, reloadToken]);

  const refresh = () => setReloadToken((token) => token + 1);

  if (isLoading) return <Spinner label="جاري تحميل المزاد…" />;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <ErrorState
          message={error}
          onRetry={() => {
            setIsLoading(true);
            setReloadToken((t) => t + 1);
          }}
        />
        <p className="mt-4">
          <Link to="/auctions" className="text-registry-green underline underline-offset-4">
            العودة إلى قائمة المزادات
          </Link>
        </p>
      </main>
    );
  }

  const lister = auction.createdBy?.companyName ?? auction.createdBy?.name ?? "—";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading title={auction.title} />

      <section className="mb-6 overflow-hidden rounded-card border border-border bg-surface">
        {auction.imageUrl ? (
          <img
            src={fileUrl(auction.imageUrl)}
            alt={`صورة ${auction.title}`}
            className="h-64 w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-64 w-full items-center justify-center border-b border-border bg-paper"
          >
            <span className="text-sm text-text-secondary">لا توجد صورة</span>
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg text-ink">تفاصيل المزاد</h2>
            <StatusStamp entity="auction" status={auction.status} />
          </div>

          {/* design.md §6 — the current price is the prominent moment. */}
          <div className="mb-6 rounded-field border border-border p-4">
            <p className="mb-1 text-sm text-text-secondary">السعر الحالي</p>
            <p
              className={`font-display text-3xl text-registry-green transition-colors duration-150 ease-out motion-reduce:transition-none ${
                priceFlash ? "text-green-dark" : ""
              }`}
            >
              <bdi className="tabular-nums" dir="ltr">
                {formatCurrency(auction.currentPrice)}
              </bdi>
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              الوقت المتبقي: <AuctionCountdown endsAt={auction.endsAt} />
            </p>
          </div>

          <p className="mb-6 whitespace-pre-line text-sm leading-7 text-ink">
            {auction.description}
          </p>

          <DataRail
            items={[
              { label: "الجهة المعلنة", value: <bdi>{lister}</bdi> },
              {
                label: "السعر الافتتاحي",
                value: (
                  <bdi className="tabular-nums" dir="ltr">
                    {formatCurrency(auction.startingPrice)}
                  </bdi>
                ),
              },
              { label: "موعد الإغلاق", value: formatDate(auction.endsAt) },
            ]}
          />
        </div>
      </section>

      <BidSection auction={auction} bids={bids} user={user} onBidPlaced={refresh} />

      {isLive ? (
        <p className="mt-4 text-xs text-text-secondary">
          يتم تحديث السعر تلقائياً كل بضع ثوانٍ.
        </p>
      ) : null}

      <p className="mt-6 text-sm">
        <Link to="/auctions" className="text-registry-green underline underline-offset-4">
          العودة إلى قائمة المزادات
        </Link>
      </p>
    </main>
  );
};

export default AuctionDetailPage;
