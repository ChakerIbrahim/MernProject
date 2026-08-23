import { useEffect, useState } from "react";
import { breakDownRemaining, remainingFrom } from "../functions/auctions";

/**
 * Live time remaining (FR-12.5). A self-contained widget with its own timer —
 * the exception in the react-component skill §1 — and it clears the interval on
 * unmount, or the tick outlives the page.
 *
 * The remaining span is derived during render rather than stored, so the effect
 * owns only the timer and a changed `endsAt` is picked up without a second
 * source of truth (skill §4).
 *
 * Digits are tabular so they do not jitter each second (design.md §3).
 *
 * @param {string} endsAt ISO timestamp
 */
const AuctionCountdown = ({ endsAt }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { isOver, days, hours, minutes, seconds } = breakDownRemaining(
    remainingFrom(endsAt)
  );

  if (isOver) {
    return <span className="text-text-secondary">انتهى المزاد</span>;
  }

  const pad = (value) => String(value).padStart(2, "0");

  return (
    <span className="tabular-nums text-ink">
      {days > 0 ? (
        <>
          <bdi>{days}</bdi> يوم و{" "}
        </>
      ) : null}
      <bdi dir="ltr">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </bdi>
    </span>
  );
};

export default AuctionCountdown;
