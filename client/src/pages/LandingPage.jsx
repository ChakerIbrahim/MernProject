/**
 * Public landing page for اعتماد.
 * Introduces the platform, explains its main value, and offers organization and individual sign-up paths.
 * The page keeps the Palestinian visual theme while using simple navigation actions.
 */
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import Button from '../components/Button';
import Icon from '../components/Icon';

/** Three short value points displayed in the platform promise section. */
const steps = [
  { number: '01', icon: 'shield', title: 'اعتماد واضح', text: 'هوية عربية وخطوات مرتبة تبدأ من التسجيل ولا تنتهي عند القرار.' },
  { number: '02', icon: 'document', title: 'فرص متصلة', text: 'مساحة تربط احتياجات المؤسسات بخبرة الموردين وحركة السوق.' },
  { number: '03', icon: 'bell', title: 'متابعة مستمرة', text: 'حالات ونتائج وإشعارات تعيد كل معلومة إلى مكانها الصحيح.' }
];

/**
 * Builds the public landing page.
 * @returns {JSX.Element} The hero, value sections, imagery, and registration calls to action.
 */
export default function LandingPage() {
  // Router helper used by the registration and login buttons.
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <main className="overflow-hidden bg-paper">
        <section className="relative isolate min-h-[620px] overflow-hidden bg-ink text-surface sm:min-h-[700px]" aria-labelledby="hero-title">
          <img src="/landing-assets/palestine-urban-horizon-hero.jpg" alt="أفق حضري فلسطيني بين تلال الزيتون عند الغروب" className="absolute inset-0 h-full w-full object-cover object-center" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-l from-ink/90 via-ink/55 to-transparent" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-ink/10" aria-hidden="true" />
          <div className="absolute inset-0 palestine-pattern opacity-20" aria-hidden="true" />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-20 sm:min-h-[700px] sm:px-6 lg:px-8">
            <div dir="rtl" className="absolute inset-y-0 start-0 flex w-full items-center px-4 py-16 text-end sm:px-6 lg:w-1/2 lg:px-8">
              <div dir="rtl" className="w-full max-w-2xl motion-rise-in">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-paper/25 bg-ink/25 px-4 py-2 text-sm text-paper/90 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-registry-green motion-pulse-ring" />
                <span>من تلال فلسطين إلى فرص الغد</span>
              </div>
              <h1 id="hero-title" dir="rtl" className="flex flex-col items-start max-w-2xl text-end text-6xl font-bold leading-tight font-display text-surface sm:text-7xl lg:text-8xl">
                <span className="block pe-12">اربط</span>
                <span className="block text-surface pe-6">الأفق</span>
                <span className="block text-registry-green">بالفرصة.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-9 text-paper/85 sm:text-xl">
                اعتماد منصة فلسطينية حديثة للمشتريات والعطاءات والمزادات، تجمع السوق في تجربة عربية واضحة، وتترك لك مساحة أكبر لتبني القادم.
              </p>
              <div className="mt-9 flex flex-col items-end gap-4 sm:flex-row sm:justify-start">
                <Button variant="primary" onClick={() => navigate('/register/organization')} className="w-full sm:w-auto">
                  ابدأ كمؤسسة
                  <Icon name="arrow" className="h-5 w-5 rtl:-scale-x-100 transition-transform group-hover:-translate-x-1" />
                </Button>
                <Button variant="secondary-dark" onClick={() => navigate('/register/individual')} className="w-full sm:w-auto">
                  سجّل كفرد
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-paper/75">
                <span className="flex items-center gap-2"><Icon name="olive" className="h-4 w-4 text-paper" /> جذور محلية</span>
                <span className="flex items-center gap-2"><Icon name="sparkle" className="h-4 w-4 text-registry-green" /> ربط رقمي</span>
                <span className="flex items-center gap-2"><Icon name="shield" className="h-4 w-4 text-registry-green" /> ثقة عملية</span>
              </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-2 bg-registry-green" aria-hidden="true" />
        </section>

        <section className="bg-surface px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="promise-title">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-5 motion-rise-in">
                <p className="mb-4 text-sm font-bold text-registry-green">01 / الوعد</p>
                <h2 id="promise-title" className="text-4xl font-bold leading-tight font-display text-ink sm:text-5xl">من الحجر القديم، إلى قرار أكثر ذكاءً.</h2>
              </div>
              <p className="border-s border-border ps-6 text-lg leading-9 text-text-secondary sm:ps-10 lg:col-span-6 lg:col-start-7">كل سوق له إيقاعه. اعتماد تمنح المؤسسات والموردين والأفراد مساحة عملية تحترم هذا الإيقاع، وتضيف إليه وضوحاً رقمياً دون أن تفقده روحه المحلية.</p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.number} className={`group border-t-4 border-ink bg-paper p-6 transition-all duration-300 hover:-translate-y-2 hover:border-registry-green hover:shadow-lg motion-rise-in motion-delay-${index + 1}`}>
                  <div className="mb-12 flex items-start justify-between">
                    <span className="text-5xl font-bold text-registry-green/40 tabular-nums" dir="ltr">{step.number}</span>
                    <Icon name={step.icon} className="h-7 w-7 text-registry-green transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-ink">{step.title}</h3>
                  <p className="text-sm leading-7 text-text-secondary">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-paper px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="technology-title">
          <div className="mx-auto grid max-w-7xl items-stretch gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="relative overflow-hidden rounded-[2rem] border-[8px] border-surface bg-surface editorial-shadow motion-rise-in">
              <img src="/landing-assets/palestine-stone-laptop.jpg" alt="حاسوب محمول يعرض لوحة متابعة على حجر فلسطيني وبجانبه غصن زيتون" className="h-full min-h-[360px] w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl border border-paper/20 bg-ink/70 px-4 py-3 text-surface backdrop-blur-sm">
                <span className="flex items-center gap-2 text-sm"><Icon name="sparkle" className="h-4 w-4 text-registry-green" /> أدوات تفهم العمل</span>
                <span className="text-xs text-paper/70">اعتماد / الآن</span>
              </div>
            </div>
            <div className="flex flex-col justify-center motion-rise-in motion-delay-1">
              <p className="mb-4 text-sm font-bold text-registry-green">02 / الأصالة تلتقي بالتكنولوجيا</p>
              <h2 id="technology-title" className="text-4xl font-bold leading-tight font-display text-ink sm:text-5xl">الأداة الحديثة لا تلغي الجذور. تجعلها أقوى.</h2>
              <p className="mt-6 text-lg leading-9 text-text-secondary">من شاشة واحدة، تتابع الفرص وتتحرك بثقة. ومن خلف الشاشة، تبقى قصة المكان حاضرة: الحجر، الزيتون، والناس الذين يصنعون السوق كل يوم.</p>
              <div className="mt-8 flex items-center gap-4 border-s-4 border-registry-green ps-5 text-sm font-bold text-ink"><Icon name="olive" className="h-6 w-6 text-registry-green" /> تجربة عربية مصممة للسوق الفلسطيني</div>
            </div>
          </div>
        </section>

        <section className="relative isolate min-h-[520px] overflow-hidden bg-ink text-surface" aria-labelledby="opportunity-title">
          <img src="/landing-assets/palestine-arch-opportunity.jpg" alt="سوق فلسطيني تاريخي مضاء من خلال قوس حجري قديم" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-l from-ink/90 via-ink/45 to-transparent" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />
          <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="ms-auto max-w-xl motion-rise-in lg:pe-6">
              <p className="mb-4 text-sm font-bold text-paper/80">03 / منظور جديد</p>
              <h2 id="opportunity-title" className="text-4xl font-bold leading-tight font-display sm:text-6xl">افتح باباً. واترك الفرصة تدخل.</h2>
              <p className="mt-6 text-lg leading-9 text-paper/80">من داخل تاريخنا، نطل على طريقة أكثر تنظيماً للمشاركة والشراء والمنافسة. أنت تختار الباب، واعتماد ترتب لك الطريق.</p>
              <Button variant="primary" onClick={() => navigate('/login')} className="mt-8">الدخول إلى اعتماد <Icon name="arrow" className="ms-2 h-5 w-5 rtl:-scale-x-100" /></Button>
            </div>
          </div>
        </section>

        <section className="bg-paper px-4 py-16 text-ink sm:px-6 lg:px-8" aria-labelledby="role-title">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-4 text-sm font-bold text-registry-green">04 / الخطوة التالية</p>
                <h2 id="role-title" className="text-4xl font-bold font-display sm:text-5xl">اختر موقعك في السوق.</h2>
              </div>
              <Icon name="olive" className="hidden h-16 w-16 text-registry-green/70 sm:block" strokeWidth={1.1} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="group flex min-h-[250px] flex-col justify-between bg-ink p-7 text-surface transition-transform duration-300 hover:-translate-y-1 sm:p-9">
                <div className="flex items-start justify-between"><Icon name="building" className="h-9 w-9 text-registry-green" /><span className="text-5xl font-bold text-paper/30">01</span></div>
                <div><h3 className="text-2xl font-bold font-display">للمؤسسات</h3><p className="mt-2 text-paper/70">حوّل احتياجك إلى فرصة تعاون.</p><Button variant="primary" onClick={() => navigate('/register/organization')} className="mt-5 w-full sm:w-auto">إنشاء حساب مؤسسة <Icon name="arrow" className="ms-2 h-4 w-4 rtl:-scale-x-100" /></Button></div>
              </div>
              <div className="group flex min-h-[250px] flex-col justify-between border border-border bg-surface p-7 text-ink transition-transform duration-300 hover:-translate-y-1 sm:p-9"><div className="flex items-start justify-between"><Icon name="gavel" className="h-9 w-9 text-registry-green" /><span className="text-5xl font-bold text-ink/30">02</span></div><div><h3 className="text-2xl font-bold font-display">للأفراد</h3><p className="mt-2 text-text-secondary">اقترب من مزادك القادم.</p><Button variant="primary" onClick={() => navigate('/register/individual')} className="mt-5 w-full sm:w-auto">إنشاء حساب فردي <Icon name="arrow" className="ms-2 h-4 w-4 rtl:-scale-x-100" /></Button></div></div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
