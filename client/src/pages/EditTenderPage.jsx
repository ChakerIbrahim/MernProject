import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../functions/api';
import PageHeading from '../components/PageHeading';
import TenderForm from '../components/TenderForm';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';

export default function EditTenderPage() {
    const { id } = useParams();
    const [tender, setTender] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [submitErrors, setSubmitErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const fetchTender = async () => {
        setIsLoading(true);
        setFetchError("");
        try {
            const res = await api.get(`/api/tenders/${id}`);
            setTender(res.data.tender);
        } catch (err) {
            setFetchError(err.response?.data?.error || "تعذّر تحميل العطاء. حاول مرة أخرى.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTender();
    }, [id]);

    const handleSubmit = async (formData) => {
        setIsSubmitting(true);
        setSubmitErrors({});

        try {
            await api.patch(`/api/tenders/${id}`, formData);
            navigate(`/tenders/${id}`);
        } catch (err) {
            setSubmitErrors(err.response?.data?.errors || { general: err.response?.data?.error || "حدث خطأ أثناء تحديث العطاء" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Spinner label="جاري تحميل بيانات العطاء..." />;
    if (fetchError) return <ErrorState message={fetchError} onRetry={fetchTender} />;
    if (!tender) return null;

    return (
        <>
            <PageHeading title="تعديل العطاء" />

            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                {submitErrors.general && (
                    <div className="mb-4 p-3 bg-red-50 border border-error text-error rounded-md text-sm" role="alert">
                        {submitErrors.general}
                    </div>
                )}
                <TenderForm initialData={tender} onSubmit={handleSubmit} isSubmitting={isSubmitting} serverErrors={submitErrors} />
            </div>
        </>
    );
}
