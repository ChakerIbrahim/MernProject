import { useState } from "react";
import Button from "./Button";
import ProposalForm from "./ProposalForm";
import api from "../functions/api";
import { readFieldErrors, readFormError } from "../functions/apiErrors";
import { describeFileProblem } from "../functions/uploads";


const ProposalSection = ({ tenderId, isApproved, isOpen }) => {
  const [values, setValues] = useState({ finalPrice: "" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("form");
  const [proposalId, setProposalId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [isDone, setIsDone] = useState(false);

  /**
   * Step 1 — create the proposal (a document must exist before it can be
   * analysed by id, SRS §4.2), then step 2 — analyse it. An analysis failure
   * still advances to review: FR-10.4 forbids blocking submission here.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Courtesy check only — the server validates independently (NFR-S7).
    const fileProblem = describeFileProblem(file);
    if (fileProblem) {
      setErrors({ ...errors, proposalDocument: fileProblem });
      setFormError("يرجى تصحيح الحقول المميّزة بالأسفل.");
      return;
    }

    setIsBusy(true);
    setErrors({});
    setFormError("");
    setProgress(0);

    const payload = new FormData();
    payload.append("finalPrice", values.finalPrice);
    payload.append("proposalDocument", file);

    let createdId = "";
    try {
      const res = await api.post(`/api/tenders/${tenderId}/proposals`, payload, {
        onUploadProgress: (event_) =>
          setProgress(
            Math.round((event_.loaded * 100) / (event_.total || event_.loaded || 1))
          ),
      });
      createdId = res.data.proposal._id;
      setProposalId(createdId);
    } catch (err) {
      // NFR-U2: the entered price and chosen file survive a failure.
      setErrors(readFieldErrors(err));
      setFormError(readFormError(err));
      setProgress(0);
      setIsBusy(false);
      return;
    }

    setStage("analysing");
    try {
      const res = await api.post(`/api/proposals/${createdId}/analyze`);
      const data = res.data.aiExtractedData;
      setAnalysis(data);
      setAnalysisFailed(false);
      // FR-10.3 — pre-filled from the analysis, never locked.
      setValues((current) => ({ ...current, finalPrice: String(data.extractedPrice) }));
    } catch {
      // FR-10.4 / NFR-R1 — the proposal already exists and stands. The user
      // keeps the price they typed and can still confirm.
      setAnalysis(null);
      setAnalysisFailed(true);
    } finally {
      setStage("review");
      setIsBusy(false);
    }
  };

  /** Step 3 — commit the reviewed price (FR-10.3). */
  const handleConfirm = async () => {
    setIsBusy(true);
    setErrors({});
    setFormError("");
    try {
      await api.patch(`/api/proposals/${proposalId}`, {
        finalPrice: Number(values.finalPrice),
      });
      setIsDone(true);
    } catch (err) {
      setErrors(readFieldErrors(err));
      setFormError(readFormError(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
      <h2 className="mb-3 font-display text-lg text-ink">تقديم عرض</h2>

      {isDone ? (
        <p
          role="status"
          className="rounded-field border border-registry-green bg-surface px-3 py-2 text-sm text-registry-green"
        >
          تم إرسال عرضك بنجاح. سيقوم صاحب العطاء بمراجعته.
        </p>
      ) : !isApproved ? (
        <p className="text-sm leading-7 text-text-secondary">
          لا يمكن تقديم عرض قبل موافقة الإدارة على حساب المؤسسة.
        </p>
      ) : !isOpen ? (
        <>
          <p className="mb-4 text-sm leading-7 text-text-secondary">
            هذا العطاء مغلق ولم يعد يقبل عروضاً جديدة.
          </p>
          <Button disabled title="العطاء مغلق">
            تقديم عرض
          </Button>
        </>
      ) : (
        <ProposalForm
          stage={stage}
          values={values}
          onChange={(field, value) => setValues({ ...values, [field]: value })}
          file={file}
          onFileChange={(next) => {
            setFile(next);
            setErrors({ ...errors, proposalDocument: undefined });
          }}
          onSubmit={handleSubmit}
          onConfirm={handleConfirm}
          analysis={analysis}
          analysisFailed={analysisFailed}
          errors={errors}
          formError={formError}
          isBusy={isBusy}
          progress={progress}
        />
      )}
    </section>
  );
};

export default ProposalSection;
