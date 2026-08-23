import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import PageHeading from "../components/PageHeading";
import TenderForm from "../components/TenderForm";
import api from "../functions/api";
import { readFieldErrors, readFormError } from "../functions/apiErrors";

const EMPTY_TENDER = {
  title: "",
  description: "",
  category: "",
  budgetEstimate: "",
  deadline: "",
};


const TenderCreatePage = () => {
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY_TENDER);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => setValues({ ...values, [field]: value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError("");

    try {
      const res = await api.post("/api/tenders", {
        ...values,
        // An empty optional number must not be sent as "".
        budgetEstimate: values.budgetEstimate === "" ? undefined : Number(values.budgetEstimate),
      });
      navigate(`/tenders/${res.data.tender._id}`, { replace: true });
    } catch (err) {
      // NFR-U2: keep everything typed.
      setErrors(readFieldErrors(err));
      setFormError(readFormError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <PageHeading
        title="نشر عطاء جديد"
        description="سيظهر العطاء في قائمة العطاءات المفتوحة فور نشره."
      />

      <TenderForm
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        errors={errors}
        formError={formError}
        isSubmitting={isSubmitting}
        submitLabel="نشر العطاء"
        secondaryAction={
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
            إلغاء
          </Button>
        }
      />
    </main>
  );
};

export default TenderCreatePage;
