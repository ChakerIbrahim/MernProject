import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuctionCreatePage from "./pages/AuctionCreatePage";
import AuctionDetailPage from "./pages/AuctionDetailPage";
import AuctionListPage from "./pages/AuctionListPage";
import AuctionPaymentPage from "./pages/AuctionPaymentPage";
import MyAuctionsPage from "./pages/MyAuctionsPage";
import IndividualDashboardPage from "./pages/IndividualDashboardPage";
import IndividualRegisterPage from "./pages/IndividualRegisterPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NegotiationPage from "./pages/NegotiationPage";
import OrganizationDashboardPage from "./pages/OrganizationDashboardPage";
import OrganizationRegisterPage from "./pages/OrganizationRegisterPage";
import TenderCreatePage from "./pages/TenderCreatePage";
import TenderDetailPage from "./pages/TenderDetailPage";
import TenderEditPage from "./pages/TenderEditPage";
import TenderListPage from "./pages/TenderListPage";
import TenderProposalsPage from "./pages/TenderProposalsPage";

// Sprint 00 keeps the RTL smoke-test page for the life of the project; Sprint 08
// keeps it out of the production bundle. import.meta.env.DEV is replaced with a
// literal false at build time, so this whole branch — and the dynamic import
// inside it — is dropped from the production build.
const RtlSmokeTestPage = import.meta.env.DEV
  ? lazy(() => import("./pages/RtlSmokeTestPage"))
  : null;

const App = () => (
  <Routes>
    {/* Public (SRS §4.1) */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register/organization" element={<OrganizationRegisterPage />} />
    <Route path="/register/individual" element={<IndividualRegisterPage />} />

    {/* Auctions are public (FR-12.4) — deliberately NOT wrapped in
        RequireAuth. The server returns only active listings, so a pending
        auction never reaches an anonymous visitor. */}
    <Route path="/auctions" element={<AuctionListPage />} />
    <Route path="/auctions/:id" element={<AuctionDetailPage />} />
    {/* FR-14.4 / FR-14.5 — an individual's own history and the simulated
        payment confirmation for a won auction (SRS §4.1). */}
    <Route
      path="/my-auctions"
      element={
        <RequireAuth>
          <RequireRole roles={["individual"]}>
            <MyAuctionsPage />
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/auctions/:id/payment"
      element={
        <RequireAuth>
          <RequireRole roles={["individual"]}>
            <AuctionPaymentPage />
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/auctions/new"
      element={
        <RequireAuth>
          <AuctionCreatePage />
        </RequireAuth>
      }
    />

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

    {/* Tenders — any authenticated user browses (FR-7.1); the server refuses
        creation and editing to anyone else (FR-6.3, FR-8.1). */}
    <Route
      path="/tenders"
      element={
        <RequireAuth>
          <TenderListPage />
        </RequireAuth>
      }
    />
    <Route
      path="/tenders/new"
      element={
        <RequireAuth>
          <RequireRole roles={["organization"]}>
            <TenderCreatePage />
          </RequireRole>
        </RequireAuth>
      }
    />
    <Route
      path="/tenders/:id"
      element={
        <RequireAuth>
          <TenderDetailPage />
        </RequireAuth>
      }
    />
    {/* FR-11.1 — the server refuses anyone but the tender owner or an admin. */}
    <Route
      path="/tenders/:id/proposals"
      element={
        <RequireAuth>
          <TenderProposalsPage />
        </RequireAuth>
      }
    />
    <Route
      path="/tenders/:id/edit"
      element={
        <RequireAuth>
          <RequireRole roles={["organization"]}>
            <TenderEditPage />
          </RequireRole>
        </RequireAuth>
      }
    />

    {/* FR-15 — the negotiation room for an accepted proposal. Reachable by
        the two participants and an admin; the server refuses everyone else. */}
    <Route
      path="/proposals/:id/negotiation"
      element={
        <RequireAuth>
          <NegotiationPage />
        </RequireAuth>
      }
    />

    {/* Development tool, not a product screen. Checked before every sprint
        sign-off (sprint-00); absent from the production build (sprint-08). */}
    {import.meta.env.DEV ? (
      <Route
        path="/dev/rtl"
        element={
          <Suspense fallback={null}>
            <RtlSmokeTestPage />
          </Suspense>
        }
      />
    ) : null}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
