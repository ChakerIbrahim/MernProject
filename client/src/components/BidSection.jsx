import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BidHistoryList from "./BidHistoryList";
import Button from "./Button";
import FormField from "./FormField";
import api from "../functions/api";
import { readFieldErrors, readFormError } from "../functions/apiErrors";
import { notifyAuctionWon } from "../functions/sendEmail";
import { formatCurrency } from "../functions/tenders";

/**
 * Bidding on one auction (FR-13).
 *
 * Browsing stays public (FR-12.4): a logged-out visitor sees the auction and a
 * prompt to sign in, never a broken form. Organizations and admins see no form
 * at all — the server refuses them with 403 regardless.
 *
 * @param {object} auction
 * @param {Array} bids
 * @param {object|null} user
 * @param {() => void} onBidPlaced  ask the page to refresh immediately
 */
const BidSection = ({ auction, bids, user, onBidPlaced }) => {
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isBidding, setIsBidding] = useState(false);

  const isIndividual = user?.role === "individual";
  const isOpen = auction.status === "active";
  const isWinner =
    auction.status === "ended" &&
    user &&
    String(auction.currentHighestBidder?._id ?? auction.currentHighestBidder ?? "") ===
      String(user._id);

  /**
   * FR-14.3 / FR-16.1 — the auction-win notice, trigger five.
   *
   * Sprint 07 left this open deliberately: an auction closes inside
   * resolveAuctionState, on a read that any anonymous visitor might make, so
   * there is no server-side moment that belongs to the winner. It is fired
   * here instead, the first time the winner actually sees the ended auction.
   *
   * The localStorage marker keeps the 4-second poll and every later visit from
   * re-sending it. NFR-R2 applies as everywhere else: this is a notice about a
   * result that already exists, and losing it changes nothing.
   */
  useEffect(() => {
    if (!isWinner) return;

    const marker = `procurement.notified.auction.${auction._id}`;
    if (localStorage.getItem(marker)) return;

    localStorage.setItem(marker, "1");
    notifyAuctionWon(auction, user);
  }, [isWinner, auction, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsBidding(true);
    setErrors({});
    setFormError("");

    try {
      await api.post(`/api/auctions/${auction._id}/bid`, { amount: Number(amount) });
      setAmount("");
      onBidPlaced();
    } catch (err) {
      // NFR-U2: the typed amount survives a rejection.
      setErrors(readFieldErrors(err));
      setFormError(readFormError(err));
    } finally {
      setIsBidding(false);
    }
  };

  return (
    <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
      <h2 className="mb-3 font-display text-lg text-ink">المزايدة</h2>

      {/* FR-14.3 — the in-app winner notice. */}
      {isWinner ? (
        <div className="mb-4 rounded-field border border-registry-green p-3">
          <p role="status" className="mb-3 text-sm leading-7 text-registry-green">
            تهانينا، لقد فزت بهذا المزاد بمبلغ{" "}
            <bdi className="tabular-nums" dir="ltr">
              {formatCurrency(auction.currentPrice)}
            </bdi>
            .
          </p>
          <Link to={`/auctions/${auction._id}/payment`}>
            <Button>متابعة إجراءات الدفع</Button>
          </Link>
        </div>
      ) : null}

      {!isOpen && !isWinner ? (
        <p className="mb-4 text-sm leading-7 text-text-secondary">
          انتهى هذا المزاد ولم يعد يقبل مزايدات جديدة.
        </p>
      ) : null}

      {isOpen && !user ? (
        <p className="mb-4 text-sm leading-7 text-text-secondary">
          تصفّح المزاد متاح للجميع، أما المزايدة فتتطلب تسجيل الدخول بحساب فرد.{" "}
          <Link to="/login" className="text-registry-green underline underline-offset-4">
            تسجيل الدخول
          </Link>
        </p>
      ) : null}

      {isOpen && user && !isIndividual ? (
        <p className="mb-4 text-sm leading-7 text-text-secondary">
          المزايدة متاحة لحسابات الأفراد فقط.
        </p>
      ) : null}

      {isOpen && isIndividual ? (
        <form onSubmit={handleSubmit} noValidate className="mb-6">
          {formError ? (
            <p
              role="alert"
              className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
            >
              {formError}
            </p>
          ) : null}

          <FormField
            id="bid-amount"
            label="قيمة المزايدة"
            type="number"
            dir="ltr"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={errors.amount}
            hint={`يجب أن تتجاوز السعر الحالي (${formatCurrency(auction.currentPrice)}).`}
            // Courtesy bound only — the server arbitrates (NFR-S7).
            min={auction.currentPrice + 1}
            required
          />

          {/* A double-submitted bid is worse here than anywhere else. */}
          <Button type="submit" isLoading={isBidding}>
            تقديم المزايدة
          </Button>
        </form>
      ) : null}

      <h3 className="mb-3 font-display text-base text-ink">سجل المزايدات</h3>
      <BidHistoryList bids={bids} />
    </section>
  );
};

export default BidSection;
