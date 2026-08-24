import { useState } from 'react';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import StatusStamp from '../components/StatusStamp';
import FormField from '../components/FormField';
import Button from '../components/Button';
import PageHeading from '../components/PageHeading';
import Card from '../components/Card';
import DataRail from '../components/DataRail';
import AppHeader from '../components/AppHeader';
import PublicHeader from '../components/PublicHeader';
import Sidebar from '../components/Sidebar';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import FileUploadField from '../components/FileUploadField';
import Countdown from '../components/Countdown';
import ConfidenceBadge from '../components/ConfidenceBadge';
import ResponsiveTable from '../components/ResponsiveTable';
import Breadcrumbs from '../components/Breadcrumbs';

export default function DevRtlPage() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="p-4 sm:p-8 space-y-12 max-w-4xl mx-auto overflow-hidden">
      <PageHeading title="اختبار المكونات والاتجاه (RTL)" />

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">الأزرار</h2>
        <div className="flex gap-4">
          <Button variant="primary">رئيسي</Button>
          <Button variant="secondary">ثانوي</Button>
          <Button variant="danger">خطر</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">الحالات والشارات</h2>
        <div className="flex gap-4 flex-wrap">
          <StatusStamp status="pending" />
          <StatusStamp status="approved" />
          <StatusStamp status="rejected" />
          <StatusStamp status="active" />
          <StatusStamp status="ended" />
        </div>
        <div className="flex gap-4 flex-wrap mt-4">
          <ConfidenceBadge score={95} />
          <ConfidenceBadge score={65} />
          <ConfidenceBadge score={30} />
          <ConfidenceBadge score={null} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">المكونات الهيكلية (Layout & Navigation)</h2>
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-2 font-bold text-ink">AppHeader (محاكاة)</h3>
            <div className="border border-border rounded-md overflow-hidden bg-paper">
              <AppHeader />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 font-bold text-ink">PublicHeader (محاكاة)</h3>
            <div className="border border-border rounded-md overflow-hidden bg-paper">
              <PublicHeader />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 font-bold text-ink">Breadcrumbs</h3>
            <Breadcrumbs items={[
              { label: 'الرئيسية', to: '/' },
              { label: 'العطاءات', to: '/tenders' },
              { label: 'توريد أجهزة حاسوب' }
            ]} />
          </Card>

          <Card className="p-4 flex gap-4">
            <div className="hidden sm:block">
              <h3 className="mb-2 font-bold text-ink">Sidebar</h3>
              <div className="border border-border rounded-md bg-paper h-full">
                <Sidebar links={[
                  { to: '#1', label: 'لوحة التحكم' },
                  { to: '#2', label: 'إدارة العطاءات' },
                  { to: '#3', label: 'الإعدادات' }
                ]} />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 font-bold text-ink">DataRail</h3>
              <DataRail
                title="معلومات التسعير"
                items={[
                  { label: 'السعر الافتتاحي', value: '5,000 ₪', tabular: true, ltr: true },
                  { label: 'الحد الأدنى للمزايدة', value: '100 ₪', tabular: true, ltr: true },
                  { label: 'الوقت المتبقي', value: <Countdown endsAt={new Date(Date.now() + 86400000)} /> }
                ]}
              />
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">النماذج (Forms)</h2>
        <Card className="p-6 space-y-4">
          <FileUploadField
            id="test-upload"
            label="مستند إثبات الشخصية"
            hint="صيغة PDF أو JPG، بحد أقصى 5 ميجابايت"
            onChange={() => {}}
          />
          <FileUploadField
            id="test-upload-error"
            label="مستند العرض المالي"
            error="حجم الملف يتجاوز الحد المسموح به"
            onChange={() => {}}
          />
          <FormField
            label="البريد الإلكتروني"
            id="email"
            type="email"
            error="صيغة البريد الإلكتروني غير صحيحة"
          />
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">الجداول والتصفية (Data Display)</h2>
        <Card className="p-4">
          <FilterBar>
            <div className="flex flex-wrap gap-4">
              <select className="border border-border rounded-md p-2 bg-surface text-ink"><option>جميع الفئات</option></select>
              <select className="border border-border rounded-md p-2 bg-surface text-ink"><option>الأحدث أولاً</option></select>
            </div>
          </FilterBar>

          <ResponsiveTable
            headers={['المؤسسة', 'السعر', 'الحالة']}
            rows={[
              { id: 'modern-tech', cells: ['شركة التقنية الحديثة', <bdi dir="ltr" className="tabular-nums">4,500 ₪</bdi>, <StatusStamp status="accepted" />] },
              { id: 'horizon-foundation', cells: ['مؤسسة الأفق', <bdi dir="ltr" className="tabular-nums">4,800 ₪</bdi>, <StatusStamp status="rejected" />] }
            ]}
            renderMobileCard={(row) => (
              <div key={row.id} className="border border-border rounded-lg p-4 space-y-2 bg-paper">
                <div className="font-bold text-ink">{row.cells[0]}</div>
                <div className="flex justify-between">{row.cells[1]} {row.cells[2]}</div>
              </div>
            )}
          />

          <Pagination currentPage={currentPage} totalPages={5} onPageChange={setCurrentPage} />
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">النوافذ المنبثقة (Dialogs)</h2>
        <Button onClick={() => setIsConfirmOpen(true)}>فتح نافذة التأكيد</Button>
        <ConfirmDialog
          isOpen={isConfirmOpen}
          title="حذف العطاء"
          message="هل أنت متأكد من رغبتك في حذف هذا العطاء؟ لا يمكن التراجع عن هذا الإجراء وسيتم إلغاء جميع العروض المقدمة."
          isDestructive={true}
          confirmLabel="نعم، احذف العطاء"
          onConfirm={() => setIsConfirmOpen(false)}
          onCancel={() => setIsConfirmOpen(false)}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">حالات الصفحة</h2>
        <div className="border border-border p-4 rounded-md space-y-8">
          <Spinner label="جاري التحميل..." />
          <hr className="border-border" />
          <EmptyState message="لا توجد بيانات لعرضها حالياً" actionLabel="إضافة جديد" onAction={() => {}} />
          <hr className="border-border" />
          <ErrorState message="حدث خطأ أثناء جلب البيانات" onRetry={() => {}} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display border-b border-border pb-2">اختبار النصوص</h2>
        <div className="w-32 border border-border p-2">
          كلمةطويلةجداًلاختبارالالتفاففيالمساحاتالضيقة
        </div>
        <p>
          هذه جملة عربية تحتوي على مصطلح <bdi>Latin Term</bdi> في المنتصف للتأكد من صحة الاتجاه.
        </p>
      </section>
    </div>
  );
}
