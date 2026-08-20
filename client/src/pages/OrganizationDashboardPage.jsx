import Button from "../components/Button";
import LogoutButton from "../components/LogoutButton";
import PageHeading from "../components/PageHeading";
import StatusStamp from "../components/StatusStamp";
import { useAuth } from "../functions/authContext";
import { isApprovedOrganization } from "../functions/roles";

/**
 * FR-3.4 / FR-1.5 — a pending organization may sign in, but sees an
 * awaiting-review notice and is given no route to tender creation. The server
 * refuses the action independently (FR-6.3).
 */
const OrganizationDashboardPage = () => {
  const { user } = useAuth();
  const canCreateTender = isApprovedOrganization(user);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="لوحة تحكم المؤسسة"
        description={user?.companyName ?? user?.name ?? ""}
        actions={<LogoutButton />}
      />

      <section className="mb-6 rounded-card border border-border bg-surface p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg text-ink">حالة الحساب</h2>
          <StatusStamp entity="organization" status={user?.status} />
        </div>

        {user?.status === "pending" ? (
          <p className="text-sm leading-7 text-text-secondary">
            حسابك قيد المراجعة من فريق الإدارة. سيتم إشعارك بالبريد الإلكتروني فور
            اتخاذ القرار، ولا يمكن نشر العطاءات أو تقديم العروض قبل الموافقة.
          </p>
        ) : null}

        {user?.status === "rejected" ? (
          <p className="text-sm leading-7 text-text-secondary">
            لم تتم الموافقة على حساب المؤسسة. راجع البيانات المقدَّمة وتواصل مع
            الإدارة لمعرفة التفاصيل.
          </p>
        ) : null}

        {canCreateTender ? (
          <p className="text-sm leading-7 text-text-secondary">
            تمت الموافقة على حسابك. يمكنك نشر العطاءات وتقديم العروض.
          </p>
        ) : null}
      </section>

      {canCreateTender ? (
        <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
          <h2 className="mb-3 font-display text-lg text-ink">العطاءات</h2>
          <p className="mb-4 text-sm text-text-secondary">
            إدارة العطاءات تُضاف في المرحلة القادمة.
          </p>
          <Button disabled>نشر عطاء جديد</Button>
        </section>
      ) : null}
    </main>
  );
};

export default OrganizationDashboardPage;
