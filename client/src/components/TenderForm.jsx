import React, { useState, useEffect } from 'react';
import FormField from './FormField';
import Button from './Button';

export default function TenderForm({ initialData, onSubmit, isSubmitting, serverErrors }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'توريدات',
        budgetEstimate: '',
        deadline: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || 'توريدات',
                budgetEstimate: initialData.budgetEstimate || '',
                deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField id="title" label="عنوان العطاء" value={formData.title} onChange={handleChange} error={serverErrors?.title} />

            <div className="flex flex-col gap-1 mb-4">
                <label htmlFor="description" className="text-sm font-medium text-ink">وصف العطاء</label>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`border rounded-md p-2 bg-surface text-ink focus:outline-none focus:ring-1 ${
                        serverErrors?.description ? 'border-error focus:ring-error' : 'border-border focus:ring-registry-green'
                    }`}
                    rows="4"
                    aria-invalid={!!serverErrors?.description}
                    aria-describedby={serverErrors?.description ? 'description-error' : undefined}
                />
                {serverErrors?.description && (
                    <span id="description-error" role="alert" className="text-sm text-error mt-1">
                        {serverErrors.description}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1 mb-4">
                <label htmlFor="category" className="text-sm font-medium text-ink">الفئة</label>
                <select
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`border rounded-md p-2 bg-surface text-ink focus:outline-none focus:ring-1 ${
                        serverErrors?.category ? 'border-error focus:ring-error' : 'border-border focus:ring-registry-green'
                    }`}
                    aria-invalid={!!serverErrors?.category}
                    aria-describedby={serverErrors?.category ? 'category-error' : undefined}
                >
                    <option value="توريدات">توريدات</option>
                    <option value="خدمات">خدمات</option>
                    <option value="أشغال عامة">أشغال عامة</option>
                    <option value="استشارات">استشارات</option>
                </select>
                {serverErrors?.category && (
                    <span id="category-error" role="alert" className="text-sm text-error mt-1">
                        {serverErrors.category}
                    </span>
                )}
            </div>

            <FormField
                id="budgetEstimate"
                label="الميزانية التقديرية (اختياري)"
                type="number"
                min="0"
                value={formData.budgetEstimate}
                onChange={handleChange}
                error={serverErrors?.budgetEstimate}
                dir="ltr"
                className="text-start tabular-nums"
            />

            <FormField
                id="deadline"
                label="الموعد النهائي"
                type="date"
                min={today}
                value={formData.deadline}
                onChange={handleChange}
                error={serverErrors?.deadline}
                dir="ltr"
                className="text-start tabular-nums"
            />

            <Button type="submit" variant="primary" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : (initialData ? 'تحديث العطاء' : 'نشر العطاء')}
            </Button>
        </form>
    );
}
