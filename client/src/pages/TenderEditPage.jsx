import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import ErrorState from "../components/ErrorState";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import TenderForm from "../components/TenderForm";
import api from "../functions/api";
import { readFieldErrors, readFormError } from "../functions/apiErrors";
import { toDateInputValue } from "../functions/tenders";

const TenderEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [values, setValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadTender = async () => {
      try {
        const res = await api.get(`/api/tenders/${id}`);
        if (cancelled) return;
        const tender = res.data.tender;
        setValues({
          title: tender.title ?? "",
          description: tender.description ?? "",
          category: tender.category ?? "",
          budgetEstimate: tender.budgetEstimate ?? "",
          deadline: toDateInputValue(tender.deadline),
        });
        setLoadError("");
      } catch (err) {
        if (!cancelled) setLoadError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTender();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const handleChange = (field, value) => setValues({ ...values, [field]: value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError("");

    try {
      await api.patch(`/api/tenders/${id}`, {
        ...values,
        budgetEstimate: values.budgetEstimate === "" ? undefined : Number(values.budgetEstimate),
      });
      navigate(`/tenders/${id}`, { replace: true });
    } catch (err) {
      setErrors(readFieldErrors(err));
      setFormError(readFormError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Spinner label="جاري تحميل العطاء…" />;

  if (loadError || !values) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <ErrorState
          message={loadError || "تعذّر تحميل العطاء."}
          onRetry={() => {
            setIsLoading(true);
            setReloadToken((token) => token + 1);
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <PageHeading title="تعديل العطاء" description="لا يمكن تعديل عطاء بعد إغلاقه." />

      <TenderForm
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        errors={errors}
        formError={formError}
        isSubmitting={isSubmitting}
        submitLabel="حفظ التعديلات"
        secondaryAction={
          <Button
            variant="secondary"
            onClick={() => navigate(`/tenders/${id}`)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
        }
      />
    </main>
  );
};

export default TenderEditPage;
