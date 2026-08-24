import { Link } from 'react-router-dom';
import Card from '../Card';
import Icon from '../Icon';
import { ACCOUNT_STATUS_CONTENT } from '../../constants/statuses';

export default function OrganizationApprovalState({ user }) {
  const state = ACCOUNT_STATUS_CONTENT[user?.status] || ACCOUNT_STATUS_CONTENT.incomplete;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg motion-rise-in">
        <Card className={`border-s-4 p-8 text-center shadow-lg sm:p-10 ${state.tone === 'error' ? 'border-s-error' : 'border-s-warning'}`}>
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${state.tone === 'error' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
            <Icon name={state.tone === 'error' ? 'document' : 'shield'} className="h-10 w-10" />
          </div>
          <p className="mb-2 text-sm font-medium text-ink/75">مؤسسة <bdi className="font-bold text-ink">{user?.companyName}</bdi></p>
          <h1 className="mb-4 font-display text-2xl font-bold text-ink">{state.title}</h1>
          <p className="mb-6 leading-relaxed text-ink/75">{state.message}</p>
          {state.action ? <Link to={state.action.to} className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-registry-green ${state.tone === 'error' ? 'border border-ink/15 bg-transparent text-ink hover:bg-ink/5' : 'bg-registry-green text-surface hover:bg-green-dark'}`}>{state.action.label}</Link> : null}
          <div className="mt-8 rounded-xl border border-border bg-paper p-5 text-start">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><Icon name="bell" className="h-4 w-4 text-registry-green" />حالة الصلاحيات</h2>
            <p className="text-sm leading-relaxed text-ink/75">طرح العطاءات وإنشاء المزادات وإدارة العروض ستصبح متاحة تلقائياً بعد اعتماد الحساب.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
