import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import FormField from "../components/FormField";
import PageHeading from "../components/PageHeading";
import api from "../functions/api";
import { readFieldErrors, readFormError } from "../functions/apiErrors";

const EMPTY_FORM = { name: "", email: "", password: "", nationalId: "" };

/** FR-2 — the account is active immediately (FR-2.2), with no document upload. */
const IndividualRegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError("");

    try {
      await api.post("/api/auth/register", { ...form, role: "individual" });
      navigate("/login", { replace: true, state: { registered: "individual" } });
    } catch (error) {
      setErrors(readFieldErrors(error));
      setFormError(readFormError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <PageHeading
        title="تسجيل حساب فرد"
        description="حساب الأفراد يُفعَّل مباشرة ويتيح المشاركة في المزادات."
      />

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
          id="ind-name"
          label="الاسم الكامل"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name}
          required
        />

        <FormField
          id="ind-email"
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
          id="ind-password"
          label="كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
          hint="ثمانية أحرف على الأقل."
          required
        />

        <FormField
          id="ind-national-id"
          label="رقم الهوية"
          dir="ltr"
          value={form.nationalId}
          onChange={handleChange("nationalId")}
          error={errors.nationalId}
          required
        />

        <Button type="submit" isLoading={isSubmitting} fullWidth>
          إنشاء الحساب
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-secondary">
        لديك حساب بالفعل؟{" "}
        <Link to="/login" className="text-registry-green underline underline-offset-4">
          تسجيل الدخول
        </Link>
      </p>
    </main>
  );
};

export default IndividualRegisterPage;
