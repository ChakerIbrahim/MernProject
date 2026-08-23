import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import FileField from "../components/FileField";
import FormField from "../components/FormField";
import PageHeading from "../components/PageHeading";
import api from "../functions/api";
import { readFieldErrors, readFormError } from "../functions/apiErrors";
import { todayForInput } from "../functions/tenders";
import { ACCEPT_ATTRIBUTE, FILE_HINT, describeFileProblem } from "../functions/uploads";

const EMPTY = { title: "", description: "", startingPrice: "", endsAt: "" };

/** FR-12.1 — an approved organization or an admin lists an auction. */
const AuctionCreatePage = () => {
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdId, setCreatedId] = useState("");

  const handle = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();

    // The image is optional (SRS §5.4) — only check one that was chosen.
    if (file) {
      const problem = describeFileProblem(file);
      if (problem) {
        setErrors({ ...errors, image: problem });
        setFormError("يرجى تصحيح الحقول المميّزة بالأسفل.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrors({});
    setFormError("");
    setProgress(0);

    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append("image", file);

    try {
      const res = await api.post("/api/auctions", payload, {
        onUploadProgress: (event_) =>
          setProgress(
            Math.round((event_.loaded * 100) / (event_.total || event_.loaded || 1))
          ),
      });
      setCreatedId(res.data.auction._id);
    } catch (err) {
      setErrors(readFieldErrors(err));
      setFormError(readFormError(err));
      setProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // FR-12.2 — without this notice a lister assumes the submission failed,
  // because the auction is nowhere to be seen publicly.
  if (createdId) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <PageHeading title="تم استلام المزاد" />
        <div className="rounded-card border border-registry-green bg-surface p-4 sm:p-6">
          <p role="status" className="mb-4 text-sm leading-7 text-ink">
            تم إنشاء المزاد بنجاح، وهو الآن قيد مراجعة الإدارة. لن يظهر في قائمة
            المزادات العامة إلا بعد الموافقة عليه.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/auctions")}>قائمة المزادات</Button>
            <Button variant="secondary" onClick={() => navigate(`/auctions/${createdId}`)}>
              عرض المزاد
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const controlClasses =
    "w-full rounded-field border bg-surface px-3 py-2 text-ink text-start " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-registry-green";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <PageHeading
        title="طرح مزاد جديد"
        description="يخضع كل مزاد لمراجعة الإدارة قبل نشره للعامة."
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
          id="auction-title"
          label="عنوان المزاد"
          value={values.title}
          onChange={handle("title")}
          error={errors.title}
          required
        />

        <div className="mb-4">
          <label htmlFor="auction-description" className="mb-1 block text-sm text-ink">
            وصف المزاد
            <span aria-hidden="true" className="text-error">
              {" *"}
            </span>
          </label>
          <textarea
            id="auction-description"
            rows={5}
            value={values.description}
            onChange={handle("description")}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? "auction-description-error" : undefined}
            className={`${controlClasses} ${errors.description ? "border-error" : "border-border"}`}
          />
          {errors.description ? (
            <p id="auction-description-error" role="alert" className="mt-1 text-sm text-error">
              {errors.description}
            </p>
          ) : null}
        </div>

        <FormField
          id="auction-starting-price"
          label="السعر الافتتاحي"
          type="number"
          dir="ltr"
          value={values.startingPrice}
          onChange={handle("startingPrice")}
          error={errors.startingPrice}
          hint="يجب أن يكون أكبر من صفر."
          min="0"
          required
        />

        <FormField
          id="auction-ends-at"
          label="موعد الإغلاق"
          type="date"
          dir="ltr"
          value={values.endsAt}
          onChange={handle("endsAt")}
          error={errors.endsAt}
          hint="يجب أن يكون تاريخاً في المستقبل."
          min={todayForInput()}
          required
        />

        <FileField
          id="image"
          label="صورة المزاد"
          accept={ACCEPT_ATTRIBUTE}
          hint={`اختياري. ${FILE_HINT}`}
          fileName={file?.name}
          onChange={(next) => {
            setFile(next);
            setErrors({ ...errors, image: undefined });
          }}
          error={errors.image}
          disabled={isSubmitting}
        />

        {isSubmitting && progress > 0 ? (
          <div className="mb-4">
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="تقدّم رفع الصورة"
              className="h-2 w-full overflow-hidden rounded-control border border-border bg-paper"
            >
              <div
                className="h-full bg-registry-green transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              جاري الرفع… <bdi className="tabular-nums">{progress}%</bdi>
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" isLoading={isSubmitting}>
            طرح المزاد
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
            إلغاء
          </Button>
        </div>
      </form>
    </main>
  );
};

export default AuctionCreatePage;
