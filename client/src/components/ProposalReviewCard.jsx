import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import ConfidenceMeter from "./ConfidenceMeter";
import StatusStamp from "./StatusStamp";
import { fileUrl } from "../functions/api";
import { formatCurrency, formatDate } from "../functions/tenders";

const NOT_ANALYSED = "لم يتم التحليل";

/**
 * One proposal awaiting the tender owner's decision (FR-11.1, FR-11.2).
 *
 * Where the AI-extracted price and the submitter's final price differ, both are
 * shown: that gap is decision-relevant, not noise. Missing AI data renders as a
 * neutral Arabic phrase, never as undefined or a blank cell.
 *
 * @param {object} proposal
 * @param {(id: string, status: string) => void} onDecide
 * @param {boolean} [isBusy]
 */
const ProposalReviewCard = ({ proposal, onDecide, isBusy = false }) => {
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);

  const ai = proposal.aiExtractedData;
  const hasAnalysis = typeof ai?.extractedPrice === "number";
  const pricesDiffer = hasAnalysis && ai.extractedPrice !== proposal.finalPrice;
  const isPending = proposal.status === "submitted";

  return (
    <article className="rounded-card border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-display text-lg text-ink">
          <bdi>{proposal.submittedBy?.companyName ?? "—"}</bdi>
        </h2>
        <StatusStamp entity="proposal" status={proposal.status} />
      </div>

      <dl className="mb-4 border-s-2 border-border ps-4 text-sm">
        <div className="mb-2 flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">السعر النهائي المعتمد:</dt>
          <dd className="text-ink">
            <bdi className="font-display tabular-nums" dir="ltr">
              {formatCurrency(proposal.finalPrice)}
            </bdi>
          </dd>
        </div>

        <div className="mb-2 flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">السعر المستخرج آلياً:</dt>
          <dd className={pricesDiffer ? "text-warning" : "text-ink"}>
            {hasAnalysis ? (
              <bdi className="tabular-nums" dir="ltr">
                {formatCurrency(ai.extractedPrice)}
              </bdi>
            ) : (
              <span className="text-text-secondary">{NOT_ANALYSED}</span>
            )}
          </dd>
        </div>

        {pricesDiffer ? (
          <p className="mb-2 text-xs text-warning">
            يختلف السعر المعتمد عن السعر المستخرج من المستند — راجع المستند قبل القرار.
          </p>
        ) : null}

        <div className="mb-2 flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">الملخص الآلي:</dt>
          <dd className="text-ink">
            {ai?.summary ? ai.summary : <span className="text-text-secondary">{NOT_ANALYSED}</span>}
          </dd>
        </div>

        <div className="flex flex-wrap gap-x-2">
          <dt className="text-text-secondary">تاريخ التقديم:</dt>
          <dd className="text-ink">{formatDate(proposal.createdAt)}</dd>
        </div>
      </dl>

      {hasAnalysis ? (
        <div className="mb-4">
          <ConfidenceMeter score={ai.confidenceScore} />
        </div>
      ) : null}

      {proposal.documentUrl ? (
        <p className="mb-4 text-sm">
          <a
            href={fileUrl(proposal.documentUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-registry-green underline underline-offset-4 hover:text-green-dark"
          >
            عرض مستند العرض
          </a>
        </p>
      ) : null}

      {/* FR-15.1 — the thread opens only on an accepted proposal. */}
      {proposal.status === "accepted" ? (
        <Link to={`/proposals/${proposal._id}/negotiation`}>
          <Button>فتح غرفة التفاوض</Button>
        </Link>
      ) : null}

      {!isPending ? null : isConfirmingReject ? (
        <div className="rounded-field border border-error p-3">
          <p className="mb-3 text-sm text-ink">
            سيتم رفض عرض <bdi>{proposal.submittedBy?.companyName}</bdi>. هل تريد المتابعة؟
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => {
                onDecide(proposal._id, "rejected");
                setIsConfirmingReject(false);
              }}
              isLoading={isBusy}
            >
              تأكيد الرفض
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsConfirmingReject(false)}
              disabled={isBusy}
            >
              إلغاء
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onDecide(proposal._id, "accepted")} isLoading={isBusy}>
            قبول العرض
          </Button>
          <Button variant="danger" onClick={() => setIsConfirmingReject(true)} disabled={isBusy}>
            رفض العرض
          </Button>
        </div>
      )}
    </article>
  );
};

export default ProposalReviewCard;
