import { useState } from "react";
import Button from "./Button";

/**
 * FR-15.1 — a simple message thread, oldest first.
 *
 * Deliberately not a chat product: no typing indicators, no read receipts, no
 * reactions. It follows the notification-list pattern from design.md §6.
 *
 * @param {Array} messages
 * @param {string} currentUserId
 * @param {boolean} canPost      an admin may read but never post
 * @param {(body: string) => Promise<void>} onSend
 * @param {boolean} [isSending]
 * @param {string} [sendError]
 */
const MessageThread = ({
  messages,
  currentUserId,
  canPost,
  onSend,
  isSending = false,
  sendError = "",
}) => {
  const [body, setBody] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    const sent = await onSend(body.trim());
    // Only clear when it actually went — NFR-U2 applies here too.
    if (sent) setBody("");
  };

  const nameOf = (sender) =>
    sender?.companyName || sender?.name || (sender?.role === "admin" ? "الإدارة" : "مشارك");

  return (
    <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
      <h2 className="mb-4 font-display text-lg text-ink">غرفة التفاوض</h2>

      {!messages.length ? (
        <p className="mb-4 text-sm text-text-secondary">
          لا توجد رسائل بعد. ابدأ التفاوض بإرسال أول رسالة.
        </p>
      ) : (
        <ul aria-live="polite" className="mb-4 flex flex-col gap-3">
          {messages.map((message) => {
            const isMine = String(message.sender?._id) === String(currentUserId);
            return (
              <li
                key={message._id}
                className={`rounded-field border p-3 text-sm ${
                  isMine ? "border-registry-green" : "border-border"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`font-medium ${isMine ? "text-registry-green" : "text-ink"}`}
                  >
                    <bdi>{nameOf(message.sender)}</bdi>
                  </span>
                  <bdi className="tabular-nums text-xs text-text-secondary" dir="ltr">
                    {new Date(message.createdAt).toLocaleString("ar", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </bdi>
                </div>
                <p className="whitespace-pre-line leading-7 text-ink">{message.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {canPost ? (
        <form onSubmit={handleSubmit} noValidate>
          {sendError ? (
            <p
              role="alert"
              className="mb-3 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
            >
              {sendError}
            </p>
          ) : null}

          <label htmlFor="negotiation-body" className="mb-1 block text-sm text-ink">
            رسالة جديدة
          </label>
          <textarea
            id="negotiation-body"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            className="mb-3 w-full rounded-field border border-border bg-surface px-3 py-2 text-sm text-ink text-start
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green"
          />

          <Button type="submit" isLoading={isSending} disabled={!body.trim()}>
            إرسال
          </Button>
        </form>
      ) : (
        <p className="text-sm text-text-secondary">
          يمكنك الاطّلاع على المحادثة دون المشاركة فيها.
        </p>
      )}
    </section>
  );
};

export default MessageThread;
