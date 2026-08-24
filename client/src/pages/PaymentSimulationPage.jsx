import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeading from '../components/PageHeading';
import Button from '../components/Button';

export default function PaymentSimulationPage() {
  const { id } = useParams();
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <main className="mx-auto max-w-xl p-5 sm:p-8">
      <PageHeading title="تأكيد الدفع التجريبي" />
      <div className="space-y-5 rounded-xl border border-warning bg-surface p-6">
        <p className="font-bold text-warning">هذه شاشة محاكاة فقط</p>
        <p className="leading-8 text-text-secondary">لن يتم خصم أي مبلغ حقيقي ولن يتم الاتصال ببوابة دفع. الغرض من هذه الخطوة هو توضيح تجربة تأكيد الفوز ضمن نسخة المنصة التجريبية.</p>
        {isConfirmed ? <p role="status" className="rounded-md border border-success p-4 text-success">تم تسجيل تأكيد الدفع التجريبي بنجاح.</p> : <Button type="button" onClick={() => setIsConfirmed(true)} className="w-full">تأكيد الدفع التجريبي</Button>}
        <Link to={`/auctions/${id}`} className="block text-center text-registry-green hover:underline focus-visible:outline-1 focus-visible:outline-registry-green">العودة إلى تفاصيل المزاد</Link>
      </div>
    </main>
  );
}
