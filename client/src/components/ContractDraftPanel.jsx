import Button from "./Button";
import Spinner from "./Spinner";

/**
 * FR-15.2 / FR-15.3 — the AI-drafted contract.
 *
 * The non-binding notice is a requirement, not fine print: it sits above the
 * draft, in warning colour, and stays visible whether or not a draft exists.
 * A draft is never presented as a finished legal document.
 *
 * @param {string} draft
 * @param {(value: string) => void} onDraftChange
 * @param {() => void} onGenerate
 * @param {boolean} isTenderOwner  only the owner may request a draft
 * @param {boolean} [isGenerating]
 * @param {string} [error]
 */
const ContractDraftPanel = ({
  draft,
  onDraftChange,
  onGenerate,
  isTenderOwner,
  isGenerating = false,
  error = "",
}) => (
  <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
    <h2 className="mb-3 font-display text-lg text-ink">مسودة العقد</h2>

    {/* FR-15.3 — permanent and prominent, never tucked away. */}
    <p
      role="note"
      className="mb-4 rounded-field border border-warning bg-surface px-3 py-2 text-sm leading-7 text-warning"
    >
      هذه مسودة أولية مولّدة آلياً للاسترشاد فقط. وهي غير ملزمة قانونياً ولا تُعتد
      إلا بعد مراجعتها وتوقيعها خارج المنصة من الطرفين.
    </p>

    {error ? (
      <p
        role="alert"
        className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
      >
        {error}
      </p>
    ) : null}

    {isGenerating ? (
      <Spinner label="جاري إنشاء مسودة العقد… قد تستغرق العملية بضع ثوانٍ." />
    ) : null}

    {!isGenerating && isTenderOwner ? (
      <div className="mb-4">
        <Button onClick={onGenerate}>
          {draft ? "إعادة إنشاء المسودة" : "إنشاء مسودة عقد"}
        </Button>
      </div>
    ) : null}

    {!isGenerating && draft ? (
      <>
        <label htmlFor="contract-draft" className="mb-1 block text-sm text-ink">
          نص المسودة (قابل للتعديل)
        </label>
        <textarea
          id="contract-draft"
          rows={14}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          className="w-full rounded-field border border-border bg-surface px-3 py-2 text-sm leading-7 text-ink text-start
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green"
        />
        <p className="mt-1 text-xs text-text-secondary">
          يمكنك تعديل النص هنا قبل نسخه أو اعتماده خارج المنصة.
        </p>
      </>
    ) : null}

    {!isGenerating && !draft && !isTenderOwner ? (
      <p className="text-sm text-text-secondary">
        لم يتم إنشاء مسودة عقد بعد. يمكن لصاحب العطاء إنشاؤها.
      </p>
    ) : null}
  </section>
);

export default ContractDraftPanel;
