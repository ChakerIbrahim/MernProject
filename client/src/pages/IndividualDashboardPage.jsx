import { Link } from "react-router-dom";
import Button from "../components/Button";
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

      <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-3 font-display text-lg text-ink">المزادات</h2>
        <p className="mb-4 text-sm leading-7 text-text-secondary">
          تصفّح المزادات النشطة وقدّم مزايدتك، وتابع نتائج مشاركاتك.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/auctions">
            <Button>تصفّح المزادات</Button>
          </Link>
          <Link to="/my-auctions">
            <Button variant="secondary">مزاداتي</Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default IndividualDashboardPage;
