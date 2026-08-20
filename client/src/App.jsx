import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import IndividualDashboardPage from "./pages/IndividualDashboardPage";
import IndividualRegisterPage from "./pages/IndividualRegisterPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import OrganizationDashboardPage from "./pages/OrganizationDashboardPage";
import OrganizationRegisterPage from "./pages/OrganizationRegisterPage";
import RtlSmokeTestPage from "./pages/RtlSmokeTestPage";

const App = () => (
  <Routes>
    {/* Public (SRS §4.1) */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register/organization" element={<OrganizationRegisterPage />} />
    <Route path="/register/individual" element={<IndividualRegisterPage />} />

    {/* Protected. RequireAuth handles "logged out", RequireRole handles
        "wrong role" — the same split as isAuth/isRole on the server. */}
    <Route
      path="/admin/dashboard"
      element={
        <RequireAuth>
          <RequireRole roles={["admin"]}>
            <AdminDashboardPage />
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/org/dashboard"
      element={
        <RequireAuth>
          <RequireRole roles={["organization"]}>
            <OrganizationDashboardPage />
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/dashboard"
      element={
        <RequireAuth>
          <RequireRole roles={["individual"]}>
            <IndividualDashboardPage />
          </RequireRole>
        </RequireAuth>
      }
    />

    {/* Development tool, not a product screen. Kept for the life of the
        project and checked before every sprint sign-off (sprint-00). */}
    <Route path="/dev/rtl" element={<RtlSmokeTestPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
