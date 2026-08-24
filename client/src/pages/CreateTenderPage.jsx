/**
 * Create-tender page.
 * Lets an organization upload an official book, review extracted data, mark priority fields, and publish a tender.
 * If analysis cannot finish, the user can continue with the same editable manual form.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../functions/api';

import Button from '../components/Button';
import Card from '../components/Card';
import Icon from '../components/Icon';

/** Labels for required tender fields that may be missing from the uploaded document. */
const missingLabels = {
  title: 'عنوان العطاء',
  description: 'وصف العطاء',
  category: 'فئة العطاء',
  deadline: 'الموعد النهائي'
};

/** Empty draft used before analysis or when the user continues manually. */
const initialDraft = { title: '', description: '', category: 'توريدات', budgetEstimate: '', deadline: '', priorityFields: [], customFields: [], missingRequiredFields: [], confidenceScore: 0 };

/**
 * Converts an AI confidence value to a percentage.
 * @param {number|string} value - Decimal or percentage confidence.
 * @returns {number} Confidence from 0 to 100.
 */
function normalizePercent(value) {
  const number = Number(value || 0);
  return number > 0 && number <= 1 ? number * 100 : number;
}

/**
 * Converts the AI response into the fields used by the editable form.
 * @param {object} aiDraft - Raw draft returned by the server.
 * @returns {object} A safe, normalized tender draft.
 */
function normalizeDraft(aiDraft = {}) {
  const customFields = Array.isArray(aiDraft.customFields) ? aiDraft.customFields.map((field, index) => ({
    key: field.key || `custom_${index + 1}`,
    label: field.label || `معلومة إضافية ${index + 1}`,
    value: field.value ?? '',
    type: ['text', 'number', 'date'].includes(field.type) ? field.type : 'text',
    required: Boolean(field.required),
    source: field.source === 'document' ? 'document' : 'manual',
    isPriority: Boolean(field.isPriority)
  })) : [];
  const missingRequiredFields = Array.isArray(aiDraft.missingRequiredFields) ? aiDraft.missingRequiredFields : [];
  const existingKeys = new Set(customFields.map((field) => field.key));
  missingRequiredFields.forEach((key) => {
    if (!missingLabels[key] && existingKeys.has(key)) return;
    if (!missingLabels[key]) customFields.push({ key, label: key, value: '', type: 'text', required: true, source: 'manual', isPriority: false });
  });
  return {
    title: aiDraft.title || '',
    description: aiDraft.description || '',
    category: aiDraft.category || 'توريدات',
    budgetEstimate: aiDraft.budgetEstimate ?? '',
    deadline: aiDraft.deadline && /^\d{4}-\d{2}-\d{2}$/.test(aiDraft.deadline) ? aiDraft.deadline : '',
    priorityFields: Array.isArray(aiDraft.priorityFields) ? aiDraft.priorityFields : [],
    customFields,
    missingRequiredFields,
    confidenceScore: normalizePercent(aiDraft.confidenceScore)
  };
}

/**
 * Renders the priority marker used as a reference for later proposal scoring.
 * @param {boolean} checked - Whether the field is marked as important.
 * @param {Function} onChange - Callback called when the checkbox changes.
 * @param {boolean} compact - Whether to use the short label.
 * @returns {JSX.Element} A labeled priority checkbox.
 */
function PriorityCheckbox({ checked, onChange, compact = false }) {
  return <label className="flex w-max cursor-pointer items-center gap-2 text-xs font-medium text-ink"><input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-ink/20 text-registry-green focus:ring-1 focus:ring-registry-green focus:ring-offset-0" /><span>{compact ? 'أولوية' : 'حقل ذو أولوية لتقييم العروض'}</span></label>;
}

/**
 * Builds the multi-step tender creation workflow.
 * @returns {JSX.Element} Upload, review, or publish form content.
 */
export default function CreateTenderPage() {
  // Router helper used after successful publication.
  const navigate = useNavigate();
  // Current workflow step.
  const [step, setStep] = useState('upload');
  // Uploaded official book and its server-side storage details.
  const [officialBook, setOfficialBook] = useState(null);
  const [officialBookUrl, setOfficialBookUrl] = useState('');
  const [officialBookName, setOfficialBookName] = useState('');
  // Editable values extracted from AI or entered manually.
  const [draft, setDraft] = useState(initialDraft);
  // Disables actions while analysis or publishing is running.
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // General and per-field messages shown above the form or below inputs.
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  // Current step shown in the analysis waiting model.
  const [aiProgressStage, setAiProgressStage] = useState(0);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  /**
   * Updates one top-level draft value and clears its old error.
   * @param {string} field - Draft property name.
   * @param {string|number} value - New field value.
   * @returns {void} Updates draft and field-error state.
   */
  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  /**
   * Adds or removes a top-level field from the proposal-scoring priority list.
   * @param {string} field - Field key to toggle.
   * @returns {void} Updates priorityFields in the draft.
   */
  const togglePriority = (field) => {
    setDraft((current) => ({
      ...current,
      priorityFields: current.priorityFields.includes(field)
        ? current.priorityFields.filter((item) => item !== field)
        : [...current.priorityFields, field]
    }));
  };

    /**
     * Updates one AI-generated custom field.
     * @param {number} index - Position of the custom field.
     * @param {string|number} value - New field value.
     * @returns {void} Updates the custom field and its error state.
     */
    const updateCustomField = (index, value) => {
      setDraft((current) => ({ ...current, customFields: current.customFields.map((field, fieldIndex) => fieldIndex === index ? { ...field, value } : field) }));
      setFieldErrors((current) => ({ ...current, [`custom_${index}`]: '' }));
    };

    /**
     * Toggles priority for one custom field.
     * @param {number} index - Position of the custom field.
     * @returns {void} Updates the field's isPriority flag.
     */
    const toggleCustomFieldPriority = (index) => {
      setDraft((current) => ({ ...current, customFields: current.customFields.map((field, fieldIndex) => fieldIndex === index ? { ...field, isPriority: !field.isPriority } : field) }));
    };

  /**
   * Validates and stores the selected official-book file.
   * @param {File|null} file - File selected by the user.
   * @returns {void} Updates file, error, and notice state.
   */
  const handleFileChange = (file) => {
    if (!file) return;
    const valid = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!valid.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('يرجى اختيار PDF أو JPG أو PNG بحجم أقصى 5 ميجابايت.');
      return;
    }
    setOfficialBook(file);
    setError('');
    setNotice('');
  };

  /**
   * Removes the selected official book from the local form.
   * @returns {void} Clears the file and general error.
   */
  const removeFile = () => {
    setOfficialBook(null);
    setError('');
  };

  /**
   * Adds the visual drag-over state to the upload area.
   * @param {React.DragEvent<HTMLElement>} e - Drag event.
   * @returns {void} Prevents browser default handling and changes classes.
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-registry-green', 'bg-registry-green/5');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-registry-green', 'bg-registry-green/5');
  };

  /**
   * Accepts the first dropped file and sends it through normal validation.
   * @param {React.DragEvent<HTMLElement>} e - Drop event.
   * @returns {void} Prevents default behavior and handles the dropped file.
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-registry-green', 'bg-registry-green/5');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  /**
   * Uploads the official book and converts the AI response into an editable draft.
   * @returns {Promise<void>} Resolves after review state or an error is set.
   * @throws {Error} The Axios error is caught and mapped to a user message.
   */
  const handleAnalyze = async () => {
    if (!officialBook) {
      setError('يرجى رفع الكتاب الرسمي للعطاء أولاً.');
      return;
    }
    setIsAnalyzing(true);
    setAiProgressStage(1);
    setError('');
    setNotice('');
    const formData = new FormData();

    // Progress stage simulation while real request runs
    const stageInterval = setInterval(() => {
      setAiProgressStage(current => current < 4 ? current + 1 : current);
    }, 1500);
    formData.append('officialBook', officialBook);
    try {
      const response = await api.post('/api/tenders/analyze-book', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDraft(normalizeDraft(response.data.aiDraft));
      setOfficialBookUrl(response.data.officialBookUrl);
      setOfficialBookName(response.data.officialBookName || officialBook.name);
      setStep('review');
      setNotice('تم تنظيم المعلومات المستخرجة. راجع كل حقل قبل النشر، وأكمل الحقول التي لم تظهر في الكتاب.');
    } catch (err) {
      const data = err.response?.data || {};
      if (data.isIrrelevant) {
        setStep('upload');
        setError(data.error || 'المستند غير مرتبط بالعطاءات. يرجى رفع كتاب رسمي صحيح.');
        return;
      }
      if (data.officialBookUrl && data.canContinueManually) {
        setDraft(initialDraft);
        setOfficialBookUrl(data.officialBookUrl);
        setOfficialBookName(data.officialBookName || officialBook.name);
        setStep('review');
        setNotice('تعذّر التحليل التلقائي حالياً، لكن تم حفظ الكتاب. يمكنك إدخال المعلومات يدوياً ثم نشر العطاء.');
      } else {
        setError(data.errors?.officialBook || data.error || 'تعذّر تحليل الكتاب الرسمي. حاول رفع ملف آخر.');
      }
    } finally {
      clearInterval(stageInterval);
      setIsAnalyzing(false);
      setAiProgressStage(0);
    }
  };

  /**
   * Checks required draft fields before publication.
   * @returns {boolean} True when the draft can be published.
   */
  const validateDraft = () => {
    const errors = {};
    if (!draft.title.trim() || draft.title.trim().length < 3) errors.title = 'عنوان العطاء مطلوب ويجب ألا يقل عن 3 أحرف.';
    if (!draft.description.trim() || draft.description.trim().length < 10) errors.description = 'أضف وصفاً واضحاً لا يقل عن 10 أحرف.';
    if (!draft.category) errors.category = 'اختر فئة العطاء.';
    if (!draft.deadline) errors.deadline = 'الموعد النهائي مطلوب لإتمام النشر.';
    else if (draft.deadline <= today) errors.deadline = 'اختر موعداً نهائياً في المستقبل.';
    draft.customFields.forEach((field, index) => {
      if (field.required && !String(field.value || '').trim()) errors[`custom_${index}`] = 'هذا الحقل مطلوب لإتمام النشر.';
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Sends the reviewed tender draft to the server.
   * @param {React.FormEvent<HTMLFormElement>} event - Publish form event.
   * @returns {Promise<void>} Resolves after navigation or an error update.
   * @throws {Error} The Axios error is caught and displayed beside the form.
   */
  const handlePublish = async (event) => {
    event.preventDefault();
    if (!validateDraft()) return;
    setIsPublishing(true);
    setError('');
    try {
      const response = await api.post('/api/tenders', {
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        budgetEstimate: draft.budgetEstimate,
        deadline: draft.deadline,
        officialBookUrl,
        officialBookName,
        customFields: JSON.stringify(draft.customFields),
        priorityFields: JSON.stringify(draft.priorityFields),
        aiExtraction: JSON.stringify({ confidenceScore: draft.confidenceScore, missingRequiredFields: draft.missingRequiredFields, priorityFields: draft.priorityFields, generatedAt: new Date().toISOString() })
      });
      navigate(`/tenders/${response.data.tender._id}`);
    } catch (err) {
      setFieldErrors(err.response?.data?.errors || {});
      setError(err.response?.data?.error || 'تعذّر نشر العطاء. راجع الحقول وحاول مرة أخرى.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 lg:space-y-8" dir="rtl">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-registry-green">
          <span className="h-2 w-2 rounded-full bg-registry-green"></span> مساعد إنشاء العطاءات بالذكاء الاصطناعي
        </div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">إنشاء عطاء جديد</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">ارفع الكتاب الرسمي، وسيقوم النظام بقراءة المستند واستخراج المعلومات الأساسية للعطاء لتراجعها وتعدلها قبل النشر.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="مراحل إنشاء العطاء">
        {[['upload', '1', 'رفع المستند', 'الكتاب الرسمي للعطاء'], ['review', '2', 'مراجعة المعلومات', 'البيانات المستخرجة من AI'], ['publish', '3', 'تأكيد النشر', 'مراجعة أخيرة ثم النشر']].map(([key, number, title, subtitle]) => {
          const isActive = step === key;
          const isDone = (step === 'review' && key === 'upload') || (step === 'publish' && key !== 'publish');
          return (
            <div key={key} className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${isActive ? 'border-registry-green/40 bg-registry-green/5' : 'border-border bg-surface'}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isActive || isDone ? 'bg-registry-green text-surface' : 'bg-paper text-text-secondary'}`}>
                {isDone ? <Icon name="check" className="h-4 w-4" /> : number}
              </span>
              <div>
                <b className="block text-sm font-bold text-ink">{title}</b>
                <span className="mt-0.5 block text-[11px] text-text-secondary">{subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {error ? <div className="rounded-xl border border-error bg-error/5 p-4 text-sm text-error" role="alert">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-info bg-info/5 p-4 text-sm text-ink" role="status">{notice}</div> : null}

      {step === 'upload' ? (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8 lg:col-span-8">
            <h2 className="mb-2 font-display text-lg font-bold text-ink">أرسل وثيقة العطاء</h2>
            <p className="mb-6 text-sm leading-relaxed text-text-secondary">يدعم النظام PDF وJPG وPNG بحجم أقصى 5 ميجابايت. بعد الرفع، سيقوم الذكاء الاصطناعي بتحليل المحتوى تلقائياً.</p>

            <label
              htmlFor="fileInput"
              className="flex min-h-[270px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-gradient-to-b from-surface to-paper/50 p-6 text-center transition-colors hover:border-registry-green hover:bg-registry-green/5"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input id="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleFileChange(e.target.files[0])} />
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-registry-green/10 text-registry-green">
                <Icon name="document" className="h-8 w-8" />
              </div>
              <strong className="mb-1.5 block text-base font-bold text-ink">اسحب الملف هنا أو اختره من جهازك</strong>
              <p className="mb-4 text-xs text-text-secondary">PDF, JPG, PNG · حتى 5 MB</p>
              <span className="inline-flex rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-registry-green shadow-sm">اختيار ملف</span>
            </label>

            {officialBook ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-registry-green/20 bg-registry-green/5 p-3.5 sm:p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-registry-green/20 bg-surface text-xs font-bold text-registry-green">
                    {officialBook.type === 'application/pdf' ? 'PDF' : 'IMG'}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-ink" dir="ltr">{officialBook.name}</strong>
                    <span className="block text-[11px] text-text-secondary">{(officialBook.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                <button type="button" onClick={removeFile} className="shrink-0 rounded-lg p-2 text-xs font-bold text-error hover:bg-error/10 focus-visible:outline-1 focus-visible:outline-error">إزالة</button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !officialBook}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-registry-green px-4 py-3.5 text-sm font-bold text-surface shadow-lg shadow-registry-green/20 transition-all hover:-translate-y-px hover:bg-green-dark disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-registry-green"
            >
              تحليل المستند والمتابعة
            </button>
          </div>

          <aside className="flex flex-col gap-5 lg:col-span-4">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h3 className="mb-3 font-display text-base font-bold text-ink">ماذا سيستخرج النظام؟</h3>
              <p className="mb-4 text-xs leading-relaxed text-text-secondary">لا تحتاج إلى إدخال بيانات العطاء يدوياً. بعد التحليل ستظهر المعلومات في نموذج قابل للمراجعة والتعديل.</p>
              <div className="space-y-3">
                {['عنوان العطاء ووصفه', 'الفئة والميزانية', 'الموعد النهائي', 'المتطلبات والشروط المهمة'].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-ink">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-registry-green/10 text-registry-green">
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <p className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <Icon name="shield" className="h-4 w-4 text-ink" />
                  <span><b className="font-bold text-ink">بياناتك تحت سيطرتك.</b> راجع النتائج قبل أي نشر.</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {/* AI Loading Modal Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
          <div className="relative w-full max-w-[470px] overflow-hidden rounded-3xl bg-surface px-6 pb-7 pt-9 text-center shadow-2xl">
            <div className="pointer-events-none absolute -end-20 -top-20 h-56 w-56 rounded-full bg-registry-green/10 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-registry-green/70 border-t-registry-green opacity-80 [animation:ai-spin_1.15s_cubic-bezier(.55,.05,.35,.95)_infinite]" />
              <div className="absolute inset-2.5 rounded-full border-2 border-transparent border-l-registry-green/10 border-r-registry-green border-t-registry-green/30 [animation:ai-spin-reverse_1.8s_linear_infinite]" />
              <div className="absolute inset-5 rounded-full border border-dashed border-registry-green/40 [animation:ai-spin_5s_linear_infinite]" />
              <div className="absolute top-1 start-8 h-2 w-2 rounded-full bg-registry-green/60 shadow-lg shadow-registry-green/20 [animation:ai-float-1_2.2s_ease-in-out_infinite]" />
              <div className="absolute top-16 end-1 h-1.5 w-1.5 rounded-full bg-registry-green/60 shadow-lg shadow-registry-green/20 [animation:ai-float-2_2.6s_ease-in-out_infinite]" />
              <div className="absolute bottom-3 start-4 h-1.5 w-1.5 rounded-full bg-registry-green/60 shadow-lg shadow-registry-green/20 [animation:ai-float-3_2.4s_ease-in-out_infinite]" />
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-registry-green to-green-dark text-surface shadow-lg [animation:ai-core-pulse_1.8s_ease-in-out_infinite]">
                <Icon name="sparkle" className="h-7 w-7" />
              </div>
            </div>

            <h2 id="ai-modal-title" className="mb-2 font-display text-lg font-bold text-ink">جاري تحليل المستند</h2>
            <p className="mx-auto mb-6 max-w-xs text-xs leading-relaxed text-text-secondary">الذكاء الاصطناعي يقرأ الكتاب ويستخرج بيانات العطاء. قد تستغرق العملية بضع لحظات.</p>

            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-paper">
              <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-registry-green/60 to-registry-green [animation:ai-progress_4.2s_ease-in-out_forwards]" />
            </div>

            <div className="flex flex-col gap-2.5 text-start">
              {[
                { num: 1, label: 'قراءة وتحليل المستند' },
                { num: 2, label: 'استخراج المعلومات الأساسية' },
                { num: 3, label: 'التحقق من البيانات' },
                { num: 4, label: 'تجهيز نموذج المراجعة' }
              ].map((s) => {
                const isActive = aiProgressStage === s.num;
                const isDone = aiProgressStage > s.num;
                return (
                  <div key={s.num} className={`flex items-center gap-2.5 text-xs ${isActive || isDone ? 'font-bold text-ink' : 'text-text-secondary'}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      isDone ? 'bg-registry-green border-registry-green text-surface' :
                      isActive ? 'border-registry-green text-registry-green [animation:ai-blink_1s_infinite]' :
                      'border-border'
                    }`}>
                      {isDone ? <Icon name="check" className="h-3 w-3" /> : s.num}
                    </span>
                    <span className={isDone ? 'text-registry-green' : ''}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 border-t border-border pt-4 text-[10px] text-text-secondary">يمكنك مراجعة وتعديل جميع النتائج قبل نشر العطاء.</div>
          </div>
        </div>
      )}

      {step === 'review' ? (
        <div className="rounded-[16px] border border-border bg-surface p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">راجع نموذج العطاء</h2>
              <p className="mt-1 text-[13px] text-text-secondary">هذه المعلومات مستخرجة من الكتاب الرسمي. عدّلها يدوياً إذا كانت غير دقيقة، وأكمل أي حقل مطلوب فارغ.</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
              ثقة التحليل: {draft.confidenceScore}%
            </span>
          </div>

          {draft.missingRequiredFields.length ? (
            <div className="mb-6 rounded-lg border-s-4 border-s-warning bg-warning/10 p-4 text-[13px] text-ink" role="status">
              <p className="font-bold">حقول تحتاج إلى استكمال</p>
              <p className="mt-1">{draft.missingRequiredFields.map((field) => missingLabels[field] || field).join('، ')}</p>
            </div>
          ) : null}

          {officialBookName ? (
            <div className="mb-6 inline-block rounded-md bg-paper px-2.5 py-1 text-[12px] text-text-secondary">
              المصدر: <bdi dir="ltr">{officialBookName}</bdi>
            </div>
          ) : null}

          <form onSubmit={handlePublish} noValidate>
            <div className="mb-5 flex flex-col gap-1.5">
              <label htmlFor="title" className="text-[13px] font-semibold text-ink">عنوان العطاء</label>
              <input id="title" type="text" value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} required className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-[14px] text-ink transition-all focus:outline-none focus:ring-1 ${fieldErrors.title ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-registry-green focus:ring-registry-green/20'}`} />
              {fieldErrors.title ? <p className="text-xs text-error">{fieldErrors.title}</p> : null}
            </div>

            <div className="mb-5 flex flex-col gap-1.5">
              <label htmlFor="description" className="text-[13px] font-semibold text-ink">وصف العطاء</label>
              <textarea id="description" value={draft.description} onChange={(e) => updateDraft('description', e.target.value)} rows="4" className={`min-h-[110px] w-full rounded-md border bg-surface px-3.5 py-2.5 text-[14px] leading-[1.6] text-ink transition-all focus:outline-none focus:ring-1 ${fieldErrors.description ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-registry-green focus:ring-registry-green/20'}`} />
              {fieldErrors.description ? <p className="text-xs text-error">{fieldErrors.description}</p> : null}
            </div>

            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-[13px] font-semibold text-ink">الفئة</label>
                <select id="category" value={draft.category} onChange={(e) => updateDraft('category', e.target.value)} className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-[14px] text-ink transition-all focus:outline-none focus:ring-1 ${fieldErrors.category ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-registry-green focus:ring-registry-green/20'}`}>
                  <option value="توريدات">توريدات</option>
                  <option value="خدمات">خدمات</option>
                  <option value="أشغال عامة">أشغال عامة</option>
                  <option value="استشارات">استشارات</option>
                </select>
                {fieldErrors.category ? <p className="text-xs text-error">{fieldErrors.category}</p> : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="budgetEstimate" className="text-[13px] font-semibold text-ink">الميزانية التقديرية (اختياري)</label>
                <input id="budgetEstimate" type="number" min="0" dir="ltr" placeholder="مثال: 500000" value={draft.budgetEstimate} onChange={(e) => updateDraft('budgetEstimate', e.target.value)} className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-start text-[14px] text-ink transition-all focus:outline-none focus:ring-1 ${fieldErrors.budgetEstimate ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-registry-green focus:ring-registry-green/20'}`} />
                {fieldErrors.budgetEstimate ? <p className="text-xs text-error">{fieldErrors.budgetEstimate}</p> : null}
              </div>
            </div>

            <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="deadline" className="text-[13px] font-semibold text-ink">الموعد النهائي</label>
                <input id="deadline" type="date" min={today} dir="ltr" value={draft.deadline} onChange={(e) => updateDraft('deadline', e.target.value)} required className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-start text-[14px] text-ink transition-all focus:outline-none focus:ring-1 ${fieldErrors.deadline ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-registry-green focus:ring-registry-green/20'}`} />
                {fieldErrors.deadline ? <p className="text-xs text-error">{fieldErrors.deadline}</p> : null}
              </div>
              <div className="flex items-end pb-2 sm:justify-end">
                <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[12px] text-text-secondary">
                  <input type="checkbox" checked={draft.priorityFields.includes('deadline')} onChange={() => togglePriority('deadline')} className="h-4 w-4 cursor-pointer rounded border-border text-registry-green accent-registry-green focus:ring-0" />
                  <span>حقل ذو أولوية لتقييم العروض</span>
                </label>
              </div>
            </div>

            {draft.customFields.length > 0 && (
              <div className="mt-7 rounded-lg border border-border bg-paper p-6">
                <div className="mb-5">
                  <h3 className="text-[15px] font-bold text-ink">معلومات مستخرجة إضافية</h3>
                  <p className="mt-0.5 text-[12px] text-text-secondary">هذه الحقول تختلف حسب محتوى كل كتاب رسمي، ويمكن تعديلها قبل النشر.</p>
                </div>

                <div className="flex flex-col gap-0">
                  {draft.customFields.map((field, index) => (
                    <div key={field.key + index} className="grid grid-cols-1 items-start gap-2 border-b border-border py-3.5 last:border-b-0 sm:grid-cols-[220px_1fr] sm:gap-4">
                      <div className="pt-2 text-[13px] font-semibold text-ink">
                        {field.label}
                        <span className="mt-0.5 block text-[11px] font-normal text-text-secondary">
                          {field.source === 'document' ? 'مستخرج من الكتاب' : 'إدخال يدوي'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <input type={field.type} value={field.value} onChange={(e) => updateCustomField(index, e.target.value)} className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-[14px] text-ink transition-all focus:outline-none focus:ring-1 ${fieldErrors[`custom_${index}`] ? 'border-error focus:border-error focus:ring-error/20' : 'border-border focus:border-registry-green focus:ring-registry-green/20'}`} />
                        <div className="flex items-center justify-between">
                          {fieldErrors[`custom_${index}`] ? <p className="text-[11px] text-error">{fieldErrors[`custom_${index}`]}</p> : <div />}
                          <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[12px] text-text-secondary">
                            <input type="checkbox" checked={Boolean(field.isPriority)} onChange={() => toggleCustomFieldPriority(index)} className="h-4 w-4 cursor-pointer rounded border-border text-registry-green accent-registry-green focus:ring-0" />
                            <span>أولوية</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
              <button type="button" onClick={() => setStep('upload')} className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-border bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-border hover:bg-paper sm:w-auto">
                العودة لاختيار كتاب آخر
              </button>
              <button type="submit" disabled={isPublishing} className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-transparent bg-registry-green px-5 py-2.5 text-[14px] font-semibold text-surface shadow-sm transition-all hover:bg-green-dark hover:shadow-lg hover:shadow-registry-green/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none sm:w-auto">
                {isPublishing ? 'جاري نشر العطاء...' : 'تأكيد ونشر العطاء'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
