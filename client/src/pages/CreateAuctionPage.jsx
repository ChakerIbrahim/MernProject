/**
 * Create-auction page.
 * Supports manual entry or document analysis, then lets the organization edit item fields and upload images.
 * The final form is submitted with Axios for administrator review.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Button from '../components/Button';
import api from '../functions/api';
import Icon from '../components/Icon';
import Card from '../components/Card';

/** Empty values used when a new auction form starts or resets. */
const initialForm = {
  title: '',
  description: '',
  startingPrice: '',
  endsAt: ''
};

/**
 * Creates one editable product-property field.
 * @param {number} index - Position used to create a stable default key.
 * @returns {object} A new manual item field.
 */
const makeField = (index) => ({
  key: `field_${index + 1}`,
  label: '',
  value: '',
  type: 'text',
  required: false,
  source: 'manual'
});

/**
 * Shows a blocking waiting state while the product document is analyzed.
 * @returns {JSX.Element} The AI analysis dialog.
 */
function AiLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auction-ai-loader-title">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-4 border-registry-green/15 border-t-registry-green [animation:ai-spin_1s_linear_infinite]">
          <Icon name="sparkle" className="h-8 w-8 text-registry-green" />
        </div>
        <h2 id="auction-ai-loader-title" className="font-display text-xl font-bold text-ink">جاري قراءة وثيقة المنتج</h2>
        <p className="mt-2 text-sm leading-7 text-text-secondary">سيتم تنظيم المعلومات في نموذج قابل للتعديل. لا تغلق الصفحة أثناء التحليل.</p>
      </div>
    </div>
  );
}

/**
 * Builds the auction creation workflow.
 * @returns {JSX.Element} The method selector, editable auction form, and submission states.
 */
export default function CreateAuctionPage() {
  // Current creation method: manual entry or document analysis.
  const [workflow, setWorkflow] = useState('manual');
  // Main auction fields and dynamic product properties.
  const [form, setForm] = useState(initialForm);
  const [itemFields, setItemFields] = useState([]);
  // Uploaded product document and server-side copy details.
  const [officialDocument, setOfficialDocument] = useState(null);
  const [officialDocumentUrl, setOfficialDocumentUrl] = useState('');
  const [officialDocumentName, setOfficialDocumentName] = useState('');
  // Product photos attached to the auction.
  const [productImages, setProductImages] = useState([]);
  // Validation and general request messages.
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [notice, setNotice] = useState('');
  // Loading states for analysis and final submission.
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Confidence returned by product-document analysis.
  const [confidenceScore, setConfidenceScore] = useState(null);

  const hasDraft = Boolean(form.title || form.description || itemFields.length);
  const showAuctionForm = workflow === 'manual' || hasDraft;
  const formattedImageCount = useMemo(() => `${productImages.length}/8`, [productImages.length]);
  const imagePreviews = useMemo(() => productImages.map((file) => ({ file, url: URL.createObjectURL(file) })), [productImages]);

  useEffect(() => () => imagePreviews.forEach(({ url }) => URL.revokeObjectURL(url)), [imagePreviews]);

  /**
   * Updates one main auction field and clears its old message.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} event - Input event.
   * @returns {void} Updates form, errors, and notice state.
   */
  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setGeneralError('');
    setNotice('');
  };

  /**
   * Selects manual entry or document-assisted creation.
   * @param {string} nextWorkflow - The selected workflow name.
   * @returns {void} Updates workflow and clears old messages.
   */
  const selectWorkflow = (nextWorkflow) => {
    setWorkflow(nextWorkflow);
    setGeneralError('');
    setNotice('');
  };

  /**
   * Stores the selected product document and clears old analysis state.
   * @param {React.ChangeEvent<HTMLInputElement>} event - File input event.
   * @returns {void} Updates document and related state.
   */
  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0] || null;
    setOfficialDocument(file);
    setOfficialDocumentUrl('');
    setOfficialDocumentName(file?.name || '');
    setConfidenceScore(null);
    setErrors((current) => ({ ...current, officialDocument: undefined }));
    setGeneralError('');
    setNotice('');
  };

  /**
   * Uploads the product document and fills the form with the AI draft.
   * @returns {Promise<void>} Resolves after draft, confidence, or error state is updated.
   * @throws {Error} The Axios error is caught and displayed to the user.
   */
  const handleAnalyzeDocument = async () => {
    if (!officialDocument) {
      setErrors((current) => ({ ...current, officialDocument: 'وثيقة معلومات المنتج مطلوبة للتحليل' }));
      return;
    }
    if (officialDocument.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, officialDocument: 'حجم الوثيقة يتجاوز الحد الأقصى (5 ميجابايت)' }));
      return;
    }

    setIsAnalyzing(true);
    setErrors({});
    setGeneralError('');
    setNotice('');
    const payload = new FormData();
    payload.append('officialDocument', officialDocument);

    try {
      const response = await api.post('/api/auctions/analyze-item', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const draft = response.data.aiDraft;
      setForm((current) => ({ ...current, title: draft.title || current.title, description: draft.description || current.description }));
      setItemFields((draft.itemFields || []).map((field, index) => ({ ...makeField(index), ...field, source: 'document' })));
      setOfficialDocumentUrl(response.data.officialDocumentUrl || '');
      setOfficialDocumentName(response.data.officialDocumentName || officialDocument.name);
      setConfidenceScore(draft.confidenceScore);
      setNotice('تم تنظيم معلومات المنتج. راجع كل حقل وعدّل البيانات قبل إرسال المزاد للمراجعة.');
    } catch (err) {
      const data = err.response?.data || {};
      if (data.officialDocumentUrl) {
        setOfficialDocumentUrl(data.officialDocumentUrl);
        setOfficialDocumentName(data.officialDocumentName || officialDocument.name);
      }
      setGeneralError(data.error || 'تعذّر تحليل الوثيقة. يمكنك متابعة الإدخال يدوياً.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Validates and adds up to eight product images.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Image input event.
   * @returns {void} Updates image or image-error state.
   */
  const handleImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const availableSlots = 8 - productImages.length;
    const nextFiles = selectedFiles.slice(0, availableSlots);
    const invalidFile = nextFiles.find((file) => !['image/jpeg', 'image/jpg', 'image/png'].includes(file.type));
    const oversizedFile = nextFiles.find((file) => file.size > 5 * 1024 * 1024);

    if (invalidFile) {
      setErrors((current) => ({ ...current, images: 'يسمح فقط برفع صور JPG أو PNG' }));
      return;
    }
    if (oversizedFile) {
      setErrors((current) => ({ ...current, images: 'يجب ألا يتجاوز حجم كل صورة 5 ميجابايت' }));
      return;
    }

    setProductImages((current) => [...current, ...nextFiles]);
    setErrors((current) => ({ ...current, images: undefined }));
    event.target.value = '';
  };

  /**
   * Removes one product image by its array position.
   * @param {number} indexToRemove - Image position to remove.
   * @returns {void} Updates the image list.
   */
  const removeImage = (indexToRemove) => {
    setProductImages((current) => current.filter((_, index) => index !== indexToRemove));
  };

  /**
   * Adds one blank product-property field until the limit is reached.
   * @returns {void} Updates itemFields.
   */
  const addItemField = () => {
    if (itemFields.length >= 30) return;
    setItemFields((current) => [...current, makeField(current.length)]);
  };

  /**
   * Updates one property name, value, type, or required flag.
   * @param {number} index - Item-field position.
   * @param {string} name - Property to update.
   * @param {string|boolean} value - New property value.
   * @returns {void} Updates itemFields.
   */
  const updateItemField = (index, name, value) => {
    setItemFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, [name]: value, source: 'manual' } : field));
  };

  /**
   * Removes one product-property field.
   * @param {number} indexToRemove - Field position to remove.
   * @returns {void} Updates itemFields.
   */
  const removeItemField = (indexToRemove) => {
    setItemFields((current) => current.filter((_, index) => index !== indexToRemove));
  };

  /**
   * Checks all required auction and item fields before submission.
   * @returns {boolean} True when the form is ready to submit.
   */
  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'عنوان المزاد مطلوب';
    if (!form.description.trim()) nextErrors.description = 'وصف المزاد مطلوب';
    if (!form.startingPrice || Number(form.startingPrice) <= 0) nextErrors.startingPrice = 'أدخل سعراً افتتاحياً أكبر من صفر';
    if (!form.endsAt) nextErrors.endsAt = 'موعد انتهاء المزاد مطلوب';
    if (form.endsAt && new Date(form.endsAt) <= new Date()) nextErrors.endsAt = 'يجب أن يكون موعد الانتهاء في المستقبل';
    const missingField = itemFields.find((field) => field.required && !String(field.value || '').trim());
    if (missingField) nextErrors.itemFields = `الحقل المطلوب غير مكتمل: ${missingField.label || 'حقل إضافي'}`;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Sends the validated auction and its files to the server.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   * @returns {Promise<void>} Resolves after success or error state is updated.
   * @throws {Error} The Axios error is caught and shown above the form.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError('');
    setNotice('');
    setUploadProgress(0);

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    payload.append('itemFields', JSON.stringify(itemFields));
    if (officialDocumentUrl) payload.append('officialDocumentUrl', officialDocumentUrl);
    if (officialDocumentName) payload.append('officialDocumentName', officialDocumentName);
    if (!officialDocumentUrl && officialDocument) payload.append('officialDocument', officialDocument);
    productImages.forEach((image) => payload.append('images', image));

    try {
      await api.post('/api/auctions', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setNotice('تم إرسال المزاد بنجاح. سيظهر للعامة بعد اعتماد المشرف له.');
      setForm(initialForm);
      setItemFields([]);
      setOfficialDocument(null);
      setOfficialDocumentUrl('');
      setOfficialDocumentName('');
      setProductImages([]);
      setConfidenceScore(null);
      setUploadProgress(100);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setGeneralError(err.response?.data?.error || 'تعذّر إنشاء المزاد. تحقّق من البيانات وحاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7" dir="rtl">
      {isAnalyzing ? <AiLoader /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/auctions" className="inline-flex items-center gap-2 text-sm font-semibold text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">← العودة إلى المزادات</Link>
        <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning">يبقى المزاد قيد مراجعة المشرف</span>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-5 py-7 shadow-sm sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -start-20 -top-24 h-64 w-64 rounded-full bg-registry-green/10 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <PageHeading title="إنشاء مزاد جديد" />
          <p className="mt-3 max-w-2xl text-sm leading-8 text-text-secondary">أنشئ نموذجاً مرناً لأي منتج أو أصل. أدخل البيانات بنفسك، أو ارفع وثيقة ليقترح الذكاء الاصطناعي الخصائص المهمة للمنتج.</p>
        </div>
      </section>

      {notice ? <p role="status" className="rounded-xl border border-success bg-success/5 p-4 text-sm font-semibold text-success">{notice}</p> : null}
      {generalError ? <p role="alert" className="rounded-xl border border-error bg-error/5 p-4 text-sm font-semibold text-error">{generalError}</p> : null}

      <section aria-labelledby="workflow-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="workflow-title" className="font-display text-xl font-bold text-ink">اختر طريقة إنشاء المزاد</h2>
            <p className="mt-1 text-sm text-text-secondary">يمكنك تعديل كل المعلومات قبل الإرسال النهائي.</p>
          </div>
          {hasDraft ? <span className="text-xs font-semibold text-success">لديك مسودة قابلة للتعديل</span> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={() => selectWorkflow('manual')} className={`group rounded-2xl border p-5 text-start transition-all focus-visible:outline-1 focus-visible:outline-registry-green ${workflow === 'manual' ? 'border-registry-green bg-registry-green/5 shadow-sm' : 'border-border bg-surface hover:border-registry-green/40'}`}>
            <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${workflow === 'manual' ? 'bg-registry-green text-surface' : 'bg-paper text-registry-green'}`}><Icon name="document" className="h-5 w-5" /></span>
            <span className="block font-display text-lg font-bold text-ink">إدخال يدوي</span>
            <span className="mt-1 block text-sm leading-7 text-text-secondary">ابدأ نموذجاً فارغاً وأضف خصائص المنتج بنفسك.</span>
          </button>
          <button type="button" onClick={() => selectWorkflow('document')} className={`group rounded-2xl border p-5 text-start transition-all focus-visible:outline-1 focus-visible:outline-registry-green ${workflow === 'document' ? 'border-registry-green bg-registry-green/5 shadow-sm' : 'border-border bg-surface hover:border-registry-green/40'}`}>
            <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${workflow === 'document' ? 'bg-registry-green text-surface' : 'bg-paper text-registry-green'}`}><Icon name="sparkle" className="h-5 w-5" /></span>
            <span className="block font-display text-lg font-bold text-ink">تحليل وثيقة المنتج</span>
            <span className="mt-1 block text-sm leading-7 text-text-secondary">ارفع وثيقة السيارة أو الكمبيوتر أو أي منتج ليتم اقتراح نموذج مخصص.</span>
          </button>
        </div>
      </section>

      {workflow === 'document' ? (
        <Card className="space-y-5 p-5 sm:p-7">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">وثيقة معلومات المنتج</h2>
            <p className="mt-1 text-sm leading-7 text-text-secondary">ارفع PDF أو JPG أو PNG تحتوي على مواصفات المنتج. سيتم الاحتفاظ بها مع بيانات المزاد بعد الإرسال.</p>
          </div>
          <label htmlFor="officialDocument" className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-paper px-5 py-6 text-center transition-colors hover:border-registry-green/60 hover:bg-registry-green/5">
            <Icon name="document" className="mb-2 h-8 w-8 text-registry-green" />
            <span className="font-semibold text-ink">{officialDocumentName || 'انقر لاختيار وثيقة المنتج'}</span>
            <span className="mt-1 text-xs text-text-secondary">PDF, JPG, PNG — بحد أقصى 5 ميجابايت</span>
            <input id="officialDocument" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocumentChange} className="sr-only" />
          </label>
          {errors.officialDocument ? <p role="alert" className="text-sm font-semibold text-error">{errors.officialDocument}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {officialDocumentUrl ? <span className="text-xs font-semibold text-success">تم حفظ الوثيقة مع المسودة</span> : <span className="text-xs text-text-secondary">لن يتم نشر المزاد قبل مراجعتك للمعلومات.</span>}
            <Button type="button" variant="secondary" onClick={handleAnalyzeDocument} disabled={isAnalyzing || !officialDocument} className="justify-center gap-2 text-registry-green">
              <Icon name="sparkle" className="h-4 w-4" />
              تحليل الوثيقة وتوليد النموذج
            </Button>
          </div>
          {confidenceScore !== null ? <div className="rounded-xl border border-success/20 bg-success/5 p-3 text-sm text-success">ثقة التحليل: <bdi dir="ltr" className="font-bold">{confidenceScore}%</bdi> — راجع البيانات قبل الإرسال.</div> : null}
        </Card>
      ) : null}

      <Card className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">صور المنتج</h2>
            <p className="mt-1 text-sm leading-7 text-text-secondary">أضف عدة صور واضحة تساعد المزايدين على تقييم المنتج. الصورة الأولى ستكون الصورة الرئيسية.</p>
          </div>
          <span className="text-xs font-bold text-text-secondary tabular-nums" dir="ltr">{formattedImageCount}</span>
        </div>
        <label htmlFor="productImages" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-paper px-4 py-4 text-sm font-bold text-registry-green transition-colors hover:border-registry-green/60 hover:bg-registry-green/5">
          <Icon name="plus" className="h-5 w-5" />
          اختيار صور المنتج
          <input id="productImages" type="file" accept="image/jpeg,image/png" multiple onChange={handleImagesChange} disabled={productImages.length >= 8} className="sr-only" />
        </label>
        {errors.images ? <p role="alert" className="text-sm font-semibold text-error">{errors.images}</p> : null}
        {productImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {imagePreviews.map(({ file: image, url }, index) => (
              <div key={`${image.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-paper">
                <img src={url} alt={`صورة المنتج ${index + 1}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeImage(index)} className="absolute end-2 top-2 rounded-full bg-ink/70 p-1.5 text-surface opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-1 focus-visible:outline-surface" aria-label={`حذف صورة المنتج ${index + 1}`}><Icon name="close" className="h-4 w-4" /></button>
                {index === 0 ? <span className="absolute bottom-2 start-2 rounded-full bg-registry-green px-2 py-1 text-[10px] font-bold text-surface">رئيسية</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {showAuctionForm ? (
      <form onSubmit={handleSubmit} className="space-y-7">
        <Card className="space-y-5 p-5 sm:p-7">
          <div className="border-b border-border pb-4">
            <h2 className="font-display text-lg font-bold text-ink">المعلومات الأساسية</h2>
            <p className="mt-1 text-sm text-text-secondary">هذه المعلومات تظهر للمزايدين في صفحة تفاصيل المزاد.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-bold text-ink">عنوان المزاد</label>
            <input id="title" name="title" value={form.title} onChange={updateField} className={`min-h-11 rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-registry-green focus:ring-1 focus:ring-registry-green/20 ${errors.title ? 'border-error' : 'border-border'}`} placeholder="مثال: سيارة تويوتا كامري موديل 2022" />
            {errors.title ? <p className="text-xs font-semibold text-error">{errors.title}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-bold text-ink">وصف المنتج أو الأصل</label>
            <textarea id="description" name="description" value={form.description} onChange={updateField} rows={5} className={`rounded-xl border bg-surface px-3.5 py-3 text-sm leading-7 text-ink outline-none transition-colors focus:border-registry-green focus:ring-1 focus:ring-registry-green/20 ${errors.description ? 'border-error' : 'border-border'}`} placeholder="اكتب وصفاً واضحاً لحالة المنتج ومواصفاته وأي ملاحظات مهمة." />
            {errors.description ? <p className="text-xs font-semibold text-error">{errors.description}</p> : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="startingPrice" className="text-sm font-bold text-ink">السعر الافتتاحي (₪)</label>
              <input id="startingPrice" name="startingPrice" type="number" min="0.01" step="0.01" dir="ltr" value={form.startingPrice} onChange={updateField} className={`min-h-11 rounded-xl border bg-surface px-3.5 py-2.5 text-start text-sm text-ink outline-none transition-colors focus:border-registry-green focus:ring-1 focus:ring-registry-green/20 ${errors.startingPrice ? 'border-error' : 'border-border'}`} placeholder="0.00" />
              {errors.startingPrice ? <p className="text-xs font-semibold text-error">{errors.startingPrice}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="endsAt" className="text-sm font-bold text-ink">موعد انتهاء المزاد</label>
              <input id="endsAt" name="endsAt" type="datetime-local" dir="ltr" value={form.endsAt} onChange={updateField} className={`min-h-11 rounded-xl border bg-surface px-3.5 py-2.5 text-start text-sm text-ink outline-none transition-colors focus:border-registry-green focus:ring-1 focus:ring-registry-green/20 ${errors.endsAt ? 'border-error' : 'border-border'}`} />
              {errors.endsAt ? <p className="text-xs font-semibold text-error">{errors.endsAt}</p> : null}
            </div>
          </div>
        <div className="border-t border-border pt-5">
          <div className="mb-4 flex items-center justify-end">
            <button type="button" onClick={addItemField} disabled={itemFields.length >= 30} className="inline-flex items-center gap-2 rounded-lg border border-registry-green/30 px-3 py-2 text-xs font-bold text-registry-green transition-colors hover:bg-registry-green/5 disabled:opacity-50 focus-visible:outline-1 focus-visible:outline-registry-green"><Icon name="plus" className="h-4 w-4" /> إضافة خاصية للمنتج</button>
          </div>

          {itemFields.length > 0 ? (
            <div className="space-y-4">
              {itemFields.map((field, index) => (
                <div key={`${field.key}-${index}`} className="rounded-xl border border-border bg-paper p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-text-secondary">خاصية {index + 1}{field.source === 'document' ? ' · مستخرجة من الوثيقة' : ' · إدخال يدوي'}</span>
                    <button type="button" onClick={() => removeItemField(index)} className="rounded-lg p-1.5 text-text-secondary hover:bg-error/10 hover:text-error focus-visible:outline-1 focus-visible:outline-error" aria-label={`حذف الخاصية ${index + 1}`}><Icon name="close" className="h-4 w-4" /></button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_150px_auto]">
                    <input value={field.label} onChange={(event) => updateItemField(index, 'label', event.target.value)} placeholder="اسم الخاصية مثل اللون" className="min-h-10 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-registry-green focus:ring-1 focus:ring-registry-green/20" />
                    <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} value={field.value} onChange={(event) => updateItemField(index, 'value', event.target.value)} placeholder="القيمة" className="min-h-10 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-registry-green focus:ring-1 focus:ring-registry-green/20" />
                    <select value={field.type} onChange={(event) => updateItemField(index, 'type', event.target.value)} className="min-h-10 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-registry-green focus:ring-1 focus:ring-registry-green/20"><option value="text">نص</option><option value="number">رقم</option><option value="date">تاريخ</option></select>
                    <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink"><input type="checkbox" checked={Boolean(field.required)} onChange={(event) => updateItemField(index, 'required', event.target.checked)} className="h-4 w-4 accent-registry-green" /> مطلوب</label>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {errors.itemFields ? <p role="alert" className="mt-3 text-sm font-semibold text-error">{errors.itemFields}</p> : null}
        </div>
        </Card>

        {isSubmitting ? <div aria-live="polite" className="rounded-xl border border-border bg-surface p-4 text-sm font-semibold text-text-secondary">جارٍ رفع البيانات والصور: <bdi dir="ltr" className="tabular-nums">{uploadProgress}%</bdi></div> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full justify-center py-3 text-base">{isSubmitting ? 'جارٍ إرسال المزاد...' : 'مراجعة وإرسال المزاد'}</Button>
      </form>
      ) : null}
    </div>
  );
}
