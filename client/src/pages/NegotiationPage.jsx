/**
 * Negotiation and chat page.
 * Loads one proposal or chat request and keeps messages updated with Socket.io.
 * It provides a fixed, scrollable conversation area with unread counts and read receipts.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import api from '../functions/api';
import { useAuth } from '../components/AuthContext';
import { io } from 'socket.io-client';

import { formatMessageTime } from '../functions/formatters';
import { API_ORIGIN } from '../functions/backendUrl';

/**
 * Reads an ID from either a populated object or a plain ID.
 * @param {object|string|null} entity - Entity returned by the API.
 * @returns {string|undefined} The usable entity ID.
 */
const getEntityId = (entity) => entity?._id || entity?.id || entity;

/**
 * Shows one or two check marks for a sent message.
 * @param {boolean} isRead - Whether the receiver has read the message.
 * @returns {JSX.Element} The message receipt indicator.
 */
function MessageReceipt({ isRead }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold leading-none ${isRead ? 'text-info' : 'text-text-secondary'}`} title={isRead ? 'تمت قراءة الرسالة' : 'تم إرسال الرسالة'} aria-label={isRead ? 'تمت قراءة الرسالة' : 'تم إرسال الرسالة'}>
      {isRead ? '✓✓' : '✓'}
    </span>
  );
}



/**
 * Builds the negotiation page and connects it to the active chat room.
 * @returns {JSX.Element} Loading, error, empty, or complete chat UI.
 */
export default function NegotiationPage() {
  // Conversation ID from the URL.
  const { id } = useParams();
  // Current URL used to identify request or proposal chat.
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  // Chat type defaults to a proposal conversation.
  const type = searchParams.get('type') || 'proposal';
  // User and token used for permissions and Socket.io authentication.
  const { user, token } = useAuth();
  // Proposal or request context returned by the server.
  const [proposal, setProposal] = useState(null);
  // Messages currently shown in the conversation.
  const [messages, setMessages] = useState([]);
  // Other conversations shown in the desktop sidebar.
  const [conversations, setConversations] = useState([]);
  // Unread message totals keyed by conversation.
  const [unreadCounts, setUnreadCounts] = useState({});
  // Text currently being typed in the composer.
  const [messageBody, setMessageBody] = useState('');
  // Controls the first page-load spinner.
  const [isLoading, setIsLoading] = useState(true);
  // Main conversation-loading error.
  const [error, setError] = useState('');
  // Error for sending one message.
  const [messageError, setMessageError] = useState('');
  // Disables the send button during the Axios request.
  const [isSending, setIsSending] = useState(false);
  const pendingReadIdsRef = useRef([]);
  const joinedRoomRef = useRef(false);
  const messagesEndRef = useRef(null);

      /**
       * Sends pending read-message IDs through the active Socket.io room.
       * @returns {void} Clears pending IDs and refreshes the header badge.
       */
      const emitPendingReadMessages = () => {
        if (!joinedRoomRef.current || pendingReadIdsRef.current.length === 0) return;
        socket.emit('mark_messages_read', {
          proposalId: id,
          messageIds: pendingReadIdsRef.current
        });
        pendingReadIdsRef.current = [];
        window.dispatchEvent(new Event('chat_badge_update'));
      };

  /**
   * Loads the active conversation and the chat sidebar list.
   * @param {boolean} showSpinner - Whether to show the full-page spinner.
   * @returns {Promise<void>} Updates context, messages, conversations, and errors.
   * @throws {Error} The Axios error is caught and saved in error state.
   */
  const loadNegotiation = async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    setError('');
    try {
      // Initial load: fetch both context and messages, plus the inbox list for the sidebar
      const [messagesResponse, inboxResponse] = await Promise.all([
        api.get(`/api/proposals/${id}/messages?type=${type}`),
        api.get('/api/users/me/chat-inbox')
      ]);

      setProposal(messagesResponse.data.context);
      setMessages(messagesResponse.data.messages || []);

      if (inboxResponse.data) {
        const { proposals = [], chatRequests = [], unreadCounts = {} } = inboxResponse.data;
        const activeRequests = chatRequests.filter(r => r.status === 'accepted');
        const normalizedConversations = [
          ...proposals.map(p => ({ ...p, _type: 'proposal' })),
          ...activeRequests.map(r => ({ ...r, _type: 'request' }))
        ].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        setConversations(normalizedConversations);
        setUnreadCounts(unreadCounts);
      }
      pendingReadIdsRef.current = messagesResponse.data.readMessageIds || [];
      emitPendingReadMessages();

    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل محادثة التفاوض.');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNegotiation(true);

    // Fallback polling: refresh messages quietly every 5 seconds just in case Socket.io fails to deliver
    const fallbackInterval = setInterval(() => {
      api.get(`/api/proposals/${id}/messages?type=${type}`).then((res) => {
        setMessages((currentMessages) => {
          const fetchedMessages = res.data.messages || [];
          if (currentMessages.length !== fetchedMessages.length) return fetchedMessages;

          // Also update read states if lengths match but read status changed
          const hasChanges = fetchedMessages.some((fMsg, i) => currentMessages[i] && fMsg.isRead !== currentMessages[i].isRead);
          return hasChanges ? fetchedMessages : currentMessages;
        });

        if (res.data.readMessageIds && res.data.readMessageIds.length > 0) {
          pendingReadIdsRef.current = res.data.readMessageIds;
          emitPendingReadMessages();
        }
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(fallbackInterval);
  }, [id, type]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize socket using the exact pattern from the learning material
  const [socket] = useState(() => io(API_ORIGIN || window.location.origin, {
    withCredentials: true,
    auth: { token }
  }));

  useEffect(() => {
    // Setup event listeners exactly as the material instructs
    socket.on('Welcome', data => console.log(data));

    socket.on('connect', () => {
      joinedRoomRef.current = false;
      socket.emit('join_negotiation', { proposalId: id, type });
    });

    socket.on('negotiation_joined', () => {
      joinedRoomRef.current = true;
      emitPendingReadMessages();
    });

    socket.on('socket_error', (data) => {
      setError(data.error || 'تعذّر الاتصال بالمحادثة.');
    });

    // If the socket was already connected before this effect was registered, join now.
    if (socket.connected) {
      socket.emit('join_negotiation', { proposalId: id, type });
    }

    socket.on('receive_new_message', (data) => {
      if (data.proposalId === id) {
        // Use the specific functional update pattern for setting state inside an event listener
        setMessages((prevMessages) => {
          if (prevMessages.some(m => m._id === data.message._id)) return prevMessages;
          return [...prevMessages, data.message];
        });

        // If it's from the other person, tell the server to mark it as read in the DB,
        // then emit a read receipt socket event
        if (String(data.message.sender?._id || data.message.sender) !== String(getEntityId(user))) {
          api.get(`/api/proposals/${id}/messages?type=${type}`).then((res) => {
            // Find which messages were just marked as read in this response
            pendingReadIdsRef.current = res.data.readMessageIds || [];
            emitPendingReadMessages();
          }).catch(() => {});
        }
      }
    });

    socket.on('messages_were_read', (data) => {
      if (data.proposalId === id) {
        // Use functional state update
        setMessages((prevMessages) =>
          prevMessages.map(msg =>
            data.readMessageIds.includes(msg._id) ? { ...msg, isRead: true } : msg
          )
        );
      }
    });

    // Leave the room and close this page's socket when the page is unmounted.
    return () => {
      joinedRoomRef.current = false;
      socket.emit('leave_negotiation', { proposalId: id });
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket, id, type, user]);

  /**
   * Validates, saves, and broadcasts a new chat message.
   * @param {React.FormEvent<HTMLFormElement>} event - Composer submit event.
   * @returns {Promise<void>} Updates the message list or message error.
   * @throws {Error} The Axios error is caught and displayed near the composer.
   */
  const handleSendMessage = async (event) => {
    event.preventDefault();
    setMessageError('');
    if (!messageBody.trim()) {
      setMessageError('نص الرسالة مطلوب');
      return;
    }
    setIsSending(true);
    try {
      const response = await api.post(`/api/proposals/${id}/messages?type=${type}`, { body: messageBody.trim() });

      // Update local state
      setMessages((current) => [...current, response.data.message]);
      setMessageBody('');

      // Emit the event to the server so it can broadcast to the other client
      socket.emit('send_new_message', {
        proposalId: id,
        message: response.data.message,
        type
      });

    } catch (err) {
      setMessageError(err.response?.data?.errors?.body || err.response?.data?.error || 'تعذّر إرسال الرسالة.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="p-5 sm:p-8"><Spinner label="جاري تحميل المحادثة..." /></div>;
  if (error) return <div className="p-5 sm:p-8"><ErrorState message={error} onRetry={() => loadNegotiation(true)} /></div>;
  if (!proposal) return <div className="p-5 sm:p-8"><EmptyState message="لم يتم العثور على بيانات المحادثة." /></div>;

  // Current user ID used to decide message direction and permissions.
  const currentUserId = getEntityId(user);
  const isTenderOwner = type === 'request'
    ? proposal.owner && String(getEntityId(proposal.owner)) === String(currentUserId)
    : proposal.tender?.createdBy && String(getEntityId(proposal.tender.createdBy)) === String(currentUserId);
  const isSubmitter = type === 'request'
    ? proposal.requester && String(getEntityId(proposal.requester)) === String(currentUserId)
    : proposal.submittedBy && String(getEntityId(proposal.submittedBy)) === String(currentUserId);

  // Only the two conversation participants may send messages.
  const canPost = isTenderOwner || isSubmitter;
  // The other participant's profile is used for the chat heading.
  const conversationPartner = type === 'request'
    ? (isTenderOwner ? proposal.requester : proposal.owner)
    : (isTenderOwner ? proposal.submittedBy : proposal.tender?.createdBy);
  // Safe fallback keeps the heading useful if the profile is incomplete.
  const partnerName = conversationPartner?.companyName || conversationPartner?.name || 'الطرف الآخر';

  return (
    <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6" dir="rtl">
      {/* Sidebar Conversation List */}
      <aside className="hidden lg:flex flex-col bg-surface border border-border rounded-2xl shadow-sm h-[calc(100vh-6rem)] sticky top-20 overflow-hidden">
        <div className="p-5 border-b border-border bg-paper/50">
          <h2 className="font-display font-bold text-ink text-lg">المحادثات النشطة</h2>
          <p className="text-xs text-text-secondary mt-1">تواصل مع الجهات المعتمدة</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-text-secondary text-center p-4">لا توجد محادثات أخرى</p>
          ) : (
            conversations.map(conv => {
              const isActive = conv._id === id;
              const unreadCount = unreadCounts[`${conv._type}_${conv._id}`] || 0;
              const isConvOwner = conv.tender?.createdBy?._id === currentUserId || conv.tender?.createdBy === currentUserId;
              const partner = conv._type === 'proposal'
                ? (isConvOwner ? conv.submittedBy : conv.tender?.createdBy)
                : (isConvOwner ? conv.requester : conv.tender?.createdBy);
              const pName = partner?.companyName || partner?.name || 'مؤسسة';

              return (
                <Link
                  key={`${conv._type}_${conv._id}`}
                  to={`/proposals/${conv._id}/negotiation?type=${conv._type}`}
                  className={`flex flex-col gap-1 p-3 rounded-xl transition-colors focus-visible:outline-1 focus-visible:outline-registry-green ${isActive ? 'bg-registry-green/10 border border-registry-green/20' : 'hover:bg-paper border border-transparent'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold truncate ${isActive ? 'text-registry-green' : 'text-ink'}`}>{pName}</span>
                    {unreadCount > 0 && !isActive && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white shadow-sm tabular-nums">
                        {unreadCount > 99 ? '+99' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary truncate">{conv.tender?.title}</span>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col gap-4 min-w-0 h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between px-1">
          <Link to={`/tenders/${proposal.tender?._id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-registry-green transition-colors hover:text-green-dark focus-visible:outline-1 focus-visible:outline-registry-green">
            <span aria-hidden="true">→</span> العودة إلى تفاصيل العطاء
          </Link>
          <Link to="/org/chat" className="lg:hidden inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-ink">
            كل المحادثات
          </Link>
        </div>

      <section className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm min-h-[550px]" aria-labelledby="messages-heading">
        <header className="flex flex-col gap-4 border-b border-border bg-paper/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 shrink-0">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-registry-green/10 text-registry-green ring-4 ring-registry-green/5" aria-hidden="true">
              <Icon name="chat" className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 id="messages-heading" className="font-display text-lg font-bold text-ink truncate">
                {type === 'request' ? 'استفسار حول العطاء' : 'محادثة التفاوض'}
              </h1>
              <p className="mt-0.5 text-xs text-text-secondary truncate">
                مع: <bdi className="font-bold text-ink">{partnerName}</bdi>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${type === 'request' ? 'border-registry-green/20 bg-registry-green/5 text-registry-green' : 'border-success/20 bg-success/5 text-success'}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${type === 'request' ? 'bg-registry-green' : 'bg-success'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${type === 'request' ? 'bg-registry-green' : 'bg-success'}`}></span>
              </span>
              {type === 'request' ? 'محادثة نشطة' : 'عرض معتمد'}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-paper px-4 py-6 sm:px-8 sm:py-8" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState message="لا توجد رسائل بعد. ابدأ المحادثة برسالة واضحة." />
            </div>
          ) : (
            <ol className="mx-auto flex max-w-3xl flex-col gap-3">
              {messages.map((message) => {
                const isMine = String(getEntityId(message.sender)) === String(currentUserId);
                const senderName = message.sender?.companyName || message.sender?.name || (isMine ? 'أنت' : 'مستخدم');
                return (
                  <li key={message._id} className={`flex w-full ${isMine ? 'justify-start' : 'justify-end'}`}>
                    <article className={`relative max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[72%] ${isMine ? 'rounded-tr-sm bg-registry-green text-surface' : 'rounded-tl-sm border border-border bg-surface text-ink'}`}>
                      <div className={`mb-1.5 flex items-center gap-2 text-[11px] font-bold ${isMine ? 'text-surface/80' : 'text-text-secondary'}`}>
                        <span>{isMine ? 'أنت' : <bdi>{senderName}</bdi>}</span>
                        <time dateTime={message.createdAt} dir="ltr" className={isMine ? 'text-surface/70' : 'text-text-secondary'}>{formatMessageTime(message.createdAt)}</time>
                      </div>
                      <p className={`whitespace-pre-wrap text-sm leading-7 ${isMine ? 'text-surface' : 'text-ink'}`}>{message.body}</p>
                      {isMine ? (
                        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-surface/75">
                          <MessageReceipt isRead={Boolean(message.isRead)} />
                          <span>{message.isRead ? 'مقروءة' : 'تم الإرسال'}</span>
                        </div>
                      ) : null}
                    </article>
                  </li>
                );
              })}
              <div ref={messagesEndRef} />
            </ol>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-surface p-4 sm:px-6 sm:py-5">
          {canPost ? (
            <form onSubmit={handleSendMessage} className="mx-auto max-w-4xl">
              <div className="flex items-end gap-3 rounded-2xl border border-border bg-surface p-2 shadow-sm transition-colors focus-within:border-registry-green focus-within:ring-1 focus-within:ring-registry-green/20">
                <label htmlFor="messageBody" className="sr-only">رسالتك</label>
                <textarea id="messageBody" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows="1" aria-invalid={messageError ? true : undefined} aria-describedby={messageError ? 'messageBody-error' : undefined} className="max-h-32 min-h-[44px] flex-1 resize-y border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-ink outline-none placeholder:text-text-secondary" placeholder="اكتب رسالتك المتعلقة بالتنفيذ أو التسليم..." />
                <button type="submit" disabled={isSending} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-registry-green px-5 text-sm font-bold text-surface shadow-sm transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-1 focus-visible:outline-registry-green" aria-label="إرسال الرسالة">
                  <span className="hidden sm:inline">{isSending ? 'جاري الإرسال...' : 'إرسال'}</span>
                  <Icon name="send" className="h-4 w-4 rotate-180" />
                </button>
              </div>
              {messageError ? <p id="messageBody-error" role="alert" className="mt-2 text-xs font-semibold text-error">{messageError}</p> : null}
            </form>
          ) : (
            <div className="mx-auto max-w-4xl rounded-xl border border-warning/20 bg-warning/5 p-4 text-center">
              <p className="text-sm font-semibold text-warning">وضع القراءة فقط</p>
              <p className="mt-1 text-xs text-text-secondary">يمكن للمشرف قراءة المحادثة لأغراض المتابعة، لكنه لا يستطيع إرسال رسائل فيها.</p>
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
