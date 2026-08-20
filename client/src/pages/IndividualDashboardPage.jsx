import EmptyState from "../components/EmptyState";
import LogoutButton from "../components/LogoutButton";
import PageHeading from "../components/PageHeading";
import { useAuth } from "../functions/authContext";

const IndividualDashboardPage = () => {
  const { user } = useAuth();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="لوحة التحكم"
        description={`مرحباً ${user?.name ?? ""}`}
        actions={<LogoutButton />}
      />

      <EmptyState message="لم تشارك في أي مزاد بعد. المزادات تُضاف في مرحلة لاحقة." />
    </main>
  );
};

export default IndividualDashboardPage;
