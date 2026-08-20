import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import FileField from "../components/FileField";
import FormField from "../components/FormField";
import PageHeading from "../components/PageHeading";
import api from "../functions/api";
import { readFieldErrors, readFormError } from "../functions/apiErrors";
import { ACCEPT_ATTRIBUTE, FILE_HINT, describeFileProblem } from "../functions/uploads";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  companyName: "",
  commercialRegisterNo: "",
};

/** FR-1 — the account is created with status "pending" (FR-1.5). */
const OrganizationRegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleChange = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });

  const handleFileChange = (nextFile) => {
    setFile(nextFile);
    setErrors({ ...errors, proofDocument: undefined });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Courtesy check only — the server validates independently (NFR-S7).
    const fileProblem = describeFileProblem(file);
    if (fileProblem) {
      setErrors({ ...errors, proofDocument: fileProblem });
      setFormError("يرجى تصحيح الحقول المميّزة بالأسفل.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setFormError("");
    setProgress(0);

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    payload.append("role", "organization");
    payload.append("proofDocument", file);

    try {
      await api.post("/api/auth/register", payload, {
        // NFR-U3: a document upload with no feedback reads as a frozen page.
        onUploadProgress: (event) =>
          setProgress(Math.round((event.loaded * 100) / (event.total || event.loaded || 1))),
      });
      navigate("/login", { replace: true, state: { registered: "organization" } });
    } catch (error) {
      // FR-1.6 / NFR-U2: show the reason, keep everything the visitor typed.
      setErrors(readFieldErrors(error));
      setFormError(readFormError(error));
      setProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <PageHeading
        title="تسجيل حساب مؤسسة"
        description="يُراجع فريق الإدارة بيانات المؤسسة والوثيقة المرفقة قبل تفعيل الحساب."
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
          id="org-company-name"
          label="اسم المؤسسة"
          value={form.companyName}
          onChange={handleChange("companyName")}
          error={errors.companyName}
          required
        />

        <FormField
          id="org-contact-name"
          label="اسم المسؤول عن الحساب"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name}
          required
        />

        <FormField
          id="org-email"
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
          id="org-password"
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
          id="org-register-no"
          label="رقم السجل التجاري"
          dir="ltr"
          value={form.commercialRegisterNo}
          onChange={handleChange("commercialRegisterNo")}
          error={errors.commercialRegisterNo}
          required
        />

        <FileField
          id="proofDocument"
          label="وثيقة الإثبات"
          accept={ACCEPT_ATTRIBUTE}
          hint={FILE_HINT}
          fileName={file?.name}
          onChange={handleFileChange}
          error={errors.proofDocument}
          disabled={isSubmitting}
          required
        />

        {isSubmitting && progress > 0 ? (
          <div className="mb-4">
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="تقدّم رفع الوثيقة"
              className="h-2 w-full overflow-hidden rounded-control border border-border bg-paper"
            >
              <div
                className="h-full bg-registry-green transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              جاري رفع الوثيقة… <bdi className="tabular-nums">{progress}%</bdi>
            </p>
          </div>
        ) : null}

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

export default OrganizationRegisterPage;
