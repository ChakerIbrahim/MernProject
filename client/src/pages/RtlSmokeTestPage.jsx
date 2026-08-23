import { useState } from "react";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import FormField from "../components/FormField";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import StatusStamp from "../components/StatusStamp";

const STAMP_SAMPLES = [
  { entity: "organization", statuses: ["pending", "approved", "rejected"] },
  { entity: "tender", statuses: ["open", "closed", "cancelled"] },
  { entity: "proposal", statuses: ["submitted", "under_review", "accepted", "rejected"] },
  { entity: "auction", statuses: ["pending_approval", "active", "ended", "cancelled"] },
];

const SECTION_CLASSES = "mb-8 rounded-card border border-border bg-surface p-4 sm:p-6";
const SECTION_TITLE_CLASSES = "mb-4 font-display text-lg text-ink";


const RtlSmokeTestPage = () => {
  const [form, setForm] = useState({ name: "", email: "", register: "" });

  const handleChange = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="فحص الاتجاه والمكوّنات المشتركة"
        description="صفحة تطوير دائمة. تعرض كل مكوّن مشترك بنص عربي حقيقي، وتكشف أخطاء الاتجاه التي لا يظهرها النص اللاتيني."
        actions={<Button variant="secondary">إجراء ثانوي</Button>}
      />

      <section className={SECTION_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>الأزرار</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">نشر العطاء</Button>
          <Button variant="secondary">حفظ كمسودة</Button>
          <Button variant="danger">حذف العطاء</Button>
          <Button variant="primary" isLoading>
            جاري الإرسال
          </Button>
          <Button variant="primary" disabled>
            غير متاح
          </Button>
        </div>
      </section>

      <section className={SECTION_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>أختام الحالة</h2>
        <div className="flex flex-col gap-3">
          {STAMP_SAMPLES.map((sample) => (
            <div key={sample.entity} className="flex flex-wrap items-center gap-2">
              {sample.statuses.map((status) => (
                <StatusStamp key={status} entity={sample.entity} status={status} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className={SECTION_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>حالات البيانات الأربع</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Spinner label="جاري تحميل العطاءات…" />
          <EmptyState
            message="لا توجد عطاءات منشورة حالياً."
            actionLabel="تحديث القائمة"
            onAction={() => {}}
          />
          <ErrorState
            message="تعذّر تحميل العطاءات. حاول مرة أخرى."
            onRetry={() => {}}
          />
        </div>
      </section>

      <section className={SECTION_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>حقول النموذج</h2>
        <FormField
          id="org-name"
          label="اسم المؤسسة"
          value={form.name}
          onChange={handleChange("name")}
          hint="الاسم كما هو مسجّل في السجل التجاري."
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
          error="البريد الإلكتروني مسجّل مسبقاً."
          required
        />
        <FormField
          id="org-register"
          label="رقم السجل التجاري"
          dir="ltr"
          value={form.register}
          onChange={handleChange("register")}
          disabled
        />
      </section>

      <section className={SECTION_CLASSES}>
        <h2 className={SECTION_TITLE_CLASSES}>مخاطر الاتجاه</h2>

        <p className="mb-2 text-sm text-text-secondary">كلمة طويلة في حاوية ضيقة:</p>
        <div className="mb-6 w-32 rounded-field border border-border p-2 text-sm text-ink">
          كهرومغناطيسية الاستراتيجيات
        </div>

        <p className="mb-2 text-sm text-text-secondary">نص عربي يحتوي مصطلحاً لاتينياً:</p>
        <p className="mb-6 text-ink">
          تم رفع الملف <bdi>proposal-final-v2.pdf</bdi> بنجاح.
        </p>

        <p className="mb-2 text-sm text-text-secondary">أرقام بخانات ثابتة واتجاه لاتيني:</p>
        <p className="mb-2 text-ink">
          السعر الحالي:{" "}
          <bdi>
            <span dir="ltr" className="font-display tabular-nums">
              12,500
            </span>
          </bdi>{" "}
          شيكل
        </p>
        <p className="text-ink">
          رقم التواصل: <span dir="ltr">+970 59 123 4567</span>
        </p>
      </section>
    </main>
  );
};

export default RtlSmokeTestPage;
