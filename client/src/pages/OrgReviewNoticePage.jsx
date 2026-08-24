/**
 * Organization review notice page.
 * Explains that a newly verified organization is waiting for administrator review.
 * The page provides a clear next step back to the public area.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import Icon from '../components/Icon';

/**
 * Builds the organization review notice.
 * @returns {JSX.Element} A notice explaining the account review state.
 */
export default function OrgReviewNoticePage() {
    // Router helper used by the home-page button.
    const navigate = useNavigate();

    return (
        <PublicLayout>
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-paper">
                <div className="absolute inset-0 palestine-pattern opacity-10" aria-hidden="true" />

                <div className="w-full max-w-lg relative z-10 motion-rise-in">
                    <Card className="p-8 sm:p-10 shadow-lg border-paper/50 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-registry-green/10 text-registry-green mb-6">
                            <Icon name="shield" className="h-10 w-10" />
                        </div>

                        <h1 className="text-3xl font-bold font-display text-ink mb-4">حسابك قيد المراجعة</h1>

                        <p className="text-lg text-text-secondary leading-relaxed mb-8">
                            تم استلام طلب تسجيل مؤسستك بنجاح. يقوم فريق المشرفين لدينا بمراجعة مستند الإثبات المرفق للتأكد من صحة البيانات.
                        </p>

                        <div className="bg-surface border border-border rounded-xl p-6 mb-8 text-start">
                            <h2 className="font-bold text-ink mb-3 flex items-center gap-2">
                                <Icon name="bell" className="h-5 w-5 text-registry-green" />
                                ماذا بعد؟
                            </h2>
                            <ul className="space-y-3 text-sm text-text-secondary">
                                <li className="flex items-start gap-2">
                                    <span className="text-registry-green mt-1">•</span>
                                    <span>تستغرق عملية المراجعة عادةً من يوم إلى يومي عمل.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-registry-green mt-1">•</span>
                                    <span>ستتلقى إشعاراً عبر البريد الإلكتروني فور اعتماد حسابك.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-registry-green mt-1">•</span>
                                    <span>بعد الاعتماد، ستتمكن من طرح العطاءات والمشاركة في المزادات.</span>
                                </li>
                            </ul>
                        </div>

                        <Button variant="primary" onClick={() => navigate('/')} className="w-full justify-center py-3 text-base">
                            العودة إلى الصفحة الرئيسية
                        </Button>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}
