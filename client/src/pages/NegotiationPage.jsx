import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ContractDraftPanel from "../components/ContractDraftPanel";
import DataRail from "../components/DataRail";
import ErrorState from "../components/ErrorState";
import MessageThread from "../components/MessageThread";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { POLL_INTERVAL_MS } from "../functions/auctions";
import { useAuth } from "../functions/authContext";
import { formatCurrency } from "../functions/tenders";

/**
 * FR-15 — the negotiation room for an accepted proposal.
 *
 * Reachable only by the tender owner and the submitting organization; an admin
 * may read. Everyone else is refused by the server, and this page renders that
 * refusal as an Arabic message rather than an empty room.
 */
const NegotiationPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [thread, setThread] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftError, setDraftError] = useState("");

  /**
   * Reuses the Sprint 07 polling pattern at the same interval, and — the part
   * that matters — clears the interval on unmount (C-10, NFR-P2).
   */
  useEffect(() => {
    let cancelled = false;
    let timer;

    const loadThread = async () => {
      try {
        const res = await api.get(`/api/proposals/${id}/messages`);
        if (cancelled) return;
        setMessages(res.data.messages);
        setThread(res.data.thread);
        // Only adopt the server's draft while the user is not editing one.
        setDraft((current) => (current ? current : res.data.thread.contractDraft ?? ""));
        setError("");
      } catch (err) {
        if (cancelled) return;
        setError(readFormError(err));
        clearInterval(timer);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadThread();
    timer = setInterval(loadThread, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id, reloadToken]);

  const handleSend = async (body) => {
    setIsSending(true);
    setSendError("");
    try {
      const res = await api.post(`/api/proposals/${id}/messages`, { body });
      setMessages((current) => [...current, res.data.message]);
      return true;
    } catch (err) {
      setSendError(readFormError(err));
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDraftError("");
    try {
      const res = await api.post(`/api/proposals/${id}/contract-draft`);
      setDraft(res.data.contractDraft);
    } catch (err) {
      // NFR-R1 discipline: the room stays usable when the model does not answer.
      setDraftError(readFormError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <Spinner label="جاري تحميل غرفة التفاوض…" />;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <PageHeading title="غرفة التفاوض" />
        <ErrorState
          message={error}
          onRetry={() => {
            setIsLoading(true);
            setReloadToken((token) => token + 1);
          }}
        />
        <p className="mt-4 text-sm">
          <Link to="/org/dashboard" className="text-registry-green underline underline-offset-4">
            العودة إلى لوحة التحكم
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="غرفة التفاوض"
        description={thread?.tenderTitle}
      />

      <section className="mb-6 rounded-card border border-border bg-surface p-4 sm:p-6">
        <DataRail
          items={[
            { label: "العطاء", value: <bdi>{thread?.tenderTitle}</bdi> },
            { label: "الجهة المنفّذة", value: <bdi>{thread?.counterpartyName}</bdi> },
            {
              label: "القيمة المعتمدة",
              value: (
                <bdi className="font-display tabular-nums" dir="ltr">
                  {formatCurrency(thread?.finalPrice)}
                </bdi>
              ),
            },
          ]}
        />
      </section>

      <div className="mb-6">
        <MessageThread
          messages={messages}
          currentUserId={user?._id}
          canPost={Boolean(thread?.canPost)}
          onSend={handleSend}
          isSending={isSending}
          sendError={sendError}
        />
      </div>

      <ContractDraftPanel
        draft={draft}
        onDraftChange={setDraft}
        onGenerate={handleGenerate}
        isTenderOwner={Boolean(thread?.isTenderOwner)}
        isGenerating={isGenerating}
        error={draftError}
      />

      <p className="mt-6 text-sm">
        <Link to="/org/dashboard" className="text-registry-green underline underline-offset-4">
          العودة إلى لوحة التحكم
        </Link>
      </p>
    </main>
  );
};

export default NegotiationPage;
