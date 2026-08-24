/**
 * Organization chat inbox page.
 * Loads pending contact requests and active conversations for the signed-in organization.
 * The page returns loading, error, empty, request, and conversation states in one view.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

import Icon from '../components/Icon';
import api from '../functions/api';

import { useAuth } from '../components/AuthContext';

/**
 * Displays the organization's chat inbox.
 * It loads inbox data with Axios, separates pending requests from active chats,
 * and returns controls for accepting, rejecting, or opening a conversation.
 * @returns {JSX.Element} The complete organization chat page.
 */
export default function OrgChatPage() {
  // The signed-in user is used to decide whether a request is incoming or outgoing.
  const { user } = useAuth();
  // Active conversations returned by the inbox endpoint.
  const [conversations, setConversations] = useState([]);
  // Contact requests that still need a response.
  const [requests, setRequests] = useState([]);
  // Unread message totals indexed by conversation type and ID.
  const [unreadCounts, setUnreadCounts] = useState({});
  // Shows the spinner while the inbox request is running.
  const [isLoading, setIsLoading] = useState(true);
  // Stores the user-friendly error shown when loading fails.
  const [error, setError] = useState('');

  /**
   * Loads the inbox and prepares one list for active conversations.
   * @returns {Promise<void>} Resolves after the inbox state is updated.
   * @throws {Error} The Axios error is caught and converted into page error state.
   */
  const loadInbox = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users/me/chat-inbox');
      const { proposals = [], chatRequests = [], unreadCounts = {} } = response.data;

      // Requests waiting for the organization to accept or reject them.
      const pendingRequests = chatRequests.filter(r => r.status === 'pending');
      // Requests that were accepted and can now be opened as conversations.
      const activeRequests = chatRequests.filter(r => r.status === 'accepted');

      // Converts proposals and accepted requests to the same display shape.
      const normalizedConversations = [
        ...proposals.map(p => ({ ...p, _type: 'proposal' })),
        ...activeRequests.map(r => ({ ...r, _type: 'request' }))
      ].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      setConversations(normalizedConversations);
      setRequests(pendingRequests);
      setUnreadCounts(unreadCounts);
    } catch (err) {
      setError(err.response?.data?.error || 'تعذّر تحميل محادثاتك. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

/**
   * Accepts or rejects one contact request.
   * @param {string} id - ID of the contact request.
   * @param {string} status - New request status, such as accepted or rejected.
   * @returns {Promise<void>} Resolves after the inbox is refreshed.
   * @throws {Error} The Axios error is caught and shown in an alert.
   */
  const handleRequestDecision = async (id, status) => {
    try {
      await api.patch(`/api/chat-requests/${id}/status`, { status });
      loadInbox();
    } catch (err) {
      alert(err.response?.data?.error || 'تعذّر تحديث حالة الطلب');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeading title="المحادثات وطلبات التواصل" />
          <p className="mt-2 max-w-2xl text-sm leading-7 text-text-secondary">
            تابع محادثاتك مع المؤسسات الأخرى سواء بناءً على عروض مقبولة أو طلبات تواصل مباشرة.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-registry-green/10 text-registry-green">
          <Icon name="chat" className="h-6 w-6" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12"><Spinner label="جاري تحميل المحادثات..." /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadInbox} />
      ) : (
        <div className="space-y-8">
          {requests.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold text-ink mb-4">طلبات تواصل قيد الانتظار ({requests.length})</h2>
              <div className="grid gap-4">
                {requests.map(req => {
                  // True when the current organization owns the tender and must respond.
                  const isIncoming = req.owner === user?.id || req.owner?._id === user?.id;
                  // Name shown for the other organization in the request row.
                  const partnerName = isIncoming ? (req.requester?.companyName || 'مؤسسة') : (req.tender?.createdBy?.companyName || 'مؤسسة');
                  return (
                    <Card key={req._id} className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6 border-warning/30 bg-warning/5">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="truncate text-lg font-bold text-ink"><bdi>{req.tender?.title || 'عطاء غير متوفر'}</bdi></span>
                          <span className="rounded bg-warning/20 px-2 py-1 text-xs font-bold text-warning">طلب تواصل</span>
                        </div>
                        <p className="text-sm text-text-secondary">
                          {isIncoming ? 'طلب تواصل من: ' : 'أرسلت طلباً إلى: '}
                          <bdi className="font-medium text-ink">{partnerName}</bdi>
                        </p>
                      </div>
                      <div className="shrink-0 flex gap-2">
                        {isIncoming ? (
                          <>
                            <Button variant="primary" onClick={() => handleRequestDecision(req._id, 'accepted')} className="w-full justify-center sm:w-auto">قبول الطلب</Button>
                            <Button variant="secondary" onClick={() => handleRequestDecision(req._id, 'rejected')} className="w-full justify-center sm:w-auto text-error hover:bg-error/10 border-error/30">رفض</Button>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-text-secondary">بانتظار رد المؤسسة</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-lg font-bold text-ink mb-4">المحادثات النشطة</h2>
            {conversations.length === 0 ? (
              <EmptyState message="لا توجد محادثات نشطة حالياً." />
            ) : (
              <div className="grid gap-4">
                {conversations.map((conv) => {
                  // Number shown beside this conversation in the inbox.
                  const unreadCount = unreadCounts[`${conv._type}_${conv._id}`] || 0;
                  // True when the current organization owns the related tender.
                  const isOwner = conv.tender?.createdBy?._id === user?.id || conv.tender?.createdBy === user?.id;
                  // The other organization, selected according to conversation type and ownership.
                  const partner = conv._type === 'proposal'
                    ? (isOwner ? conv.submittedBy : conv.tender?.createdBy)
                    : (isOwner ? conv.requester : conv.tender?.createdBy);
                  // Friendly name shown under the conversation title.
                  const partnerName = partner?.companyName || partner?.name || 'مؤسسة';
                  // Both proposals and requests open the same negotiation route with a type query.
                  const link = `/proposals/${conv._id}/negotiation?type=${conv._type}`;

                  return (
                    <Card key={`${conv._type}_${conv._id}`} className={`flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6 transition-colors hover:border-registry-green/50 ${unreadCount > 0 ? 'border-registry-green/30 bg-registry-green/5' : ''}`}>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link to={link} className="truncate text-lg font-bold text-ink hover:text-registry-green focus-visible:outline-1 focus-visible:outline-registry-green">
                            <bdi>{conv.tender?.title || 'عطاء غير متوفر'}</bdi>
                          </Link>
                          {conv._type === 'proposal' ? (
                            <span className="rounded bg-success/10 px-2 py-1 text-xs font-bold text-success border border-success/20">عرض مقبول</span>
                          ) : (
                            <span className="rounded bg-registry-green/10 px-2 py-1 text-xs font-bold text-registry-green border border-registry-green/20">تواصل مباشر</span>
                          )}
                          {unreadCount > 0 && (
                            <span className="flex items-center justify-center rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-white shadow-sm tabular-nums min-w-[20px]">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">
                          المحادثة مع: <bdi className="font-medium text-ink">{partnerName}</bdi>
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Link to={link}>
                          <Button variant={unreadCount > 0 ? 'primary' : 'secondary'} className="w-full justify-center sm:w-auto">
                            {unreadCount > 0 ? 'قراءة الرسائل' : 'فتح المحادثة'}
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
