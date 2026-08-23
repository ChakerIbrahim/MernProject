import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageHeading from "../components/PageHeading";
import Spinner from "../components/Spinner";
import TenderCard from "../components/TenderCard";
import TenderFilters from "../components/TenderFilters";
import api from "../functions/api";
import { readFormError } from "../functions/apiErrors";
import { useAuth } from "../functions/authContext";
import { isApprovedOrganization } from "../functions/roles";

const TenderListPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // The URL is the single source of truth for the filters, so a filtered view
  // is shareable and survives a refresh.
  const values = {
    category: searchParams.get("category") ?? "",
    minBudget: searchParams.get("minBudget") ?? "",
    maxBudget: searchParams.get("maxBudget") ?? "",
  };
  const hasFilters = Boolean(values.category || values.minBudget || values.maxBudget);
  const query = searchParams.toString();

  useEffect(() => {
    let cancelled = false;

    const loadTenders = async () => {
      try {
        const res = await api.get(`/api/tenders${query ? `?${query}` : ""}`);
        if (cancelled) return;
        setTenders(res.data.tenders);
        setError("");
      } catch (err) {
        if (!cancelled) setError(readFormError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTenders();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleFilterChange = (next) => {
    const merged = { ...values, ...next };
    const params = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== "") params[key] = value;
    });
    setIsLoading(true);
    setSearchParams(params);
  };

  const handleReset = () => {
    setIsLoading(true);
    setSearchParams({});
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <PageHeading
        title="العطاءات المتاحة"
        description="تصفّح العطاءات المفتوحة وصفّها حسب الفئة أو الميزانية."
        actions={
          isApprovedOrganization(user) ? (
            <Link to="/tenders/new">
              <Button>نشر عطاء جديد</Button>
            </Link>
          ) : null
        }
      />

      <TenderFilters
        values={values}
        onChange={handleFilterChange}
        onReset={handleReset}
        hasFilters={hasFilters}
      />

      {isLoading ? <Spinner label="جاري تحميل العطاءات…" /> : null}

      {!isLoading && error ? (
        <ErrorState message={error} onRetry={() => setSearchParams(searchParams)} />
      ) : null}

      {!isLoading && !error && !tenders.length ? (
        <EmptyState
          message={
            hasFilters
              ? "لا توجد عطاءات مطابقة لمعايير التصفية."
              : "لا توجد عطاءات منشورة حالياً."
          }
          actionLabel={hasFilters ? "إزالة التصفية" : undefined}
          onAction={hasFilters ? handleReset : undefined}
        />
      ) : null}

      {!isLoading && !error && tenders.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {tenders.map((tender) => (
            <TenderCard key={tender._id} tender={tender} />
          ))}
        </div>
      ) : null}
    </main>
  );
};

export default TenderListPage;
