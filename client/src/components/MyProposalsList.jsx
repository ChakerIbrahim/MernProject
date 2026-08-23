import { Link } from "react-router-dom";
import Button from "./Button";
import EmptyState from "./EmptyState";
import StatusStamp from "./StatusStamp";
import { formatCurrency, formatDate } from "../functions/tenders";

/**
 * The proposals this organization has submitted, and how each was decided.
 *
 * SRS §4.1 describes the organization dashboard as "My tenders, my proposals";
 * this is the second half, added in Sprint 09 because FR-15.1 gives the
 * submitter one side of the negotiation thread and there was previously no way
 * for them to reach an accepted proposal.
 *
 * @param {Array} proposals
 */
const MyProposalsList = ({ proposals }) => {
  if (!proposals.length) {
    return <EmptyState message="لم تقدّم أي عرض على عطاءات الجهات الأخرى بعد." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {proposals.map((proposal) => (
        <article
          key={proposal._id}
          className="rounded-card border border-border bg-surface p-4 sm:p-6"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-display text-base text-ink">
              <Link
                to={`/tenders/${proposal.tender?._id}`}
                className="hover:text-registry-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green"
              >
                <bdi>{proposal.tender?.title ?? "—"}</bdi>
              </Link>
            </h3>
            <StatusStamp entity="proposal" status={proposal.status} />
          </div>

          <dl className="mb-4 border-s-2 border-border ps-4 text-sm">
            <div className="mb-2 flex flex-wrap gap-x-2">
              <dt className="text-text-secondary">سعرك المقدَّم:</dt>
              <dd>
                <bdi className="font-display tabular-nums text-ink" dir="ltr">
                  {formatCurrency(proposal.finalPrice)}
                </bdi>
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-text-secondary">تاريخ التقديم:</dt>
              <dd className="text-ink">{formatDate(proposal.createdAt)}</dd>
            </div>
          </dl>

          {/* FR-15.1 — the thread exists only once the proposal is accepted. */}
          {proposal.status === "accepted" ? (
            <Link to={`/proposals/${proposal._id}/negotiation`}>
              <Button>فتح غرفة التفاوض</Button>
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
};

export default MyProposalsList;
