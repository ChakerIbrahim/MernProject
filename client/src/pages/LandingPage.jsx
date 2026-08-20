import { Link } from "react-router-dom";
import Button from "../components/Button";
import PageHeading from "../components/PageHeading";
import { useAuth } from "../functions/authContext";
import { dashboardPathFor } from "../functions/roles";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="منصة المشتريات والمزادات"
        description="منصة لنشر العطاءات وتقديم العروض عليها، وطرح المزادات والمزايدة عليها، تحت إشراف إدارة المنصة."
      />

      <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
        {user ? (
          <>
            <h2 className="mb-3 font-display text-lg text-ink">
              مرحباً <bdi>{user.name}</bdi>
            </h2>
            <Link to={dashboardPathFor(user.role)}>
              <Button>الانتقال إلى لوحة التحكم</Button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="mb-3 font-display text-lg text-ink">ابدأ الآن</h2>
            <p className="mb-4 text-sm leading-7 text-text-secondary">
              سجّل حساب مؤسسة لنشر العطاءات وتقديم العروض، أو حساب فرد للمشاركة في
              المزادات. حسابات المؤسسات تخضع لمراجعة الإدارة قبل التفعيل.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register/organization">
                <Button>تسجيل مؤسسة</Button>
              </Link>
              <Link to="/register/individual">
                <Button variant="secondary">تسجيل فرد</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary">تسجيل الدخول</Button>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Development tool, not a product screen — see sprint-00. */}
      <p className="mt-6 text-xs text-text-secondary">
        أداة تطوير:{" "}
        <Link
          to="/dev/rtl"
          className="text-registry-green underline underline-offset-4 hover:text-green-dark"
        >
          صفحة فحص الاتجاه والمكوّنات المشتركة
        </Link>
      </p>
    </main>
  );
};

export default LandingPage;
