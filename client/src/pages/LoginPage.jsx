import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import FormField from "../components/FormField";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import { useAuth } from "../functions/authContext";
import { readFieldErrors, readFormError } from "../functions/apiErrors";
import { dashboardPathFor } from "../functions/roles";

const LoginPage = () => {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const justRegistered = location.state?.registered ?? null;

  const handleChange = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError("");

    try {
      const nextUser = await login(form.email, form.password);
      navigate(dashboardPathFor(nextUser.role), { replace: true });
    } catch (error) {
      // NFR-U2: the entered data is never cleared on failure.
      setErrors(readFieldErrors(error));
      setFormError(readFormError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Spinner label="جاري التحقق من الجلسة…" />;
  if (user) return <Navigate to={dashboardPathFor(user.role)} replace />;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <PageHeading title="تسجيل الدخول" description="أدخل بريدك الإلكتروني وكلمة المرور." />

      {justRegistered ? (
        <p
          role="status"
          className="mb-4 rounded-field border border-registry-green bg-surface px-3 py-2 text-sm text-registry-green"
        >
          {justRegistered === "organization"
            ? "تم إنشاء حساب المؤسسة. الحساب قيد المراجعة من الإدارة، ويمكنك تسجيل الدخول لمتابعة حالته."
            : "تم إنشاء حسابك بنجاح. يمكنك تسجيل الدخول الآن."}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-card border border-border bg-surface p-4 sm:p-6"
      >
        {formError ? (
          <p
            role="alert"
            className="mb-4 rounded-field border border-error bg-surface px-3 py-2 text-sm text-error"
          >
            {formError}
          </p>
        ) : null}

        <FormField
          id="login-email"
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          autoComplete="email"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
          required
        />

        <FormField
          id="login-password"
          label="كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
          required
        />

        <Button type="submit" isLoading={isSubmitting} fullWidth>
          دخول
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-secondary">
        لا تملك حساباً؟{" "}
        <Link to="/register/organization" className="text-registry-green underline underline-offset-4">
          تسجيل مؤسسة
        </Link>{" "}
        أو{" "}
        <Link to="/register/individual" className="text-registry-green underline underline-offset-4">
          تسجيل فرد
        </Link>
      </p>
    </main>
  );
};

export default LoginPage;
