import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OrgRegisterPage from './pages/OrgRegisterPage';
import OrgReviewNoticePage from './pages/OrgReviewNoticePage';
import OrgVerifyEmailPage from './pages/OrgVerifyEmailPage';
import IndRegisterPage from './pages/IndRegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminTendersPage from './pages/AdminTendersPage';
import AdminAuctionsPage from './pages/AdminAuctionsPage';
import OrgDashboard from './pages/OrgDashboard';
import IndDashboard from './pages/IndDashboard';
import TendersListPage from './pages/TendersListPage';
import TenderDetailPage from './pages/TenderDetailPage';
import CreateTenderPage from './pages/CreateTenderPage';
import EditTenderPage from './pages/EditTenderPage';
import AuctionsListPage from './pages/AuctionsListPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import MyAuctionsPage from './pages/MyAuctionsPage';
import PaymentSimulationPage from './pages/PaymentSimulationPage';
import NegotiationPage from './pages/NegotiationPage';
import ProposalDetailPage from './pages/ProposalDetailPage';
import OrgChatPage from './pages/OrgChatPage';
import OrgProfilePage from './pages/OrgProfilePage';
import OrgTendersPage from './pages/OrgTendersPage';
import OrgProposalsPage from './pages/OrgProposalsPage';
import OrgReportsPage from './pages/OrgReportsPage';
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';
import { AuthProvider } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import GlobalLayout from './components/GlobalLayout';

import LandingPage from './pages/LandingPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/organization" element={<OrgRegisterPage />} />
        <Route path="/register/organization/review" element={<OrgReviewNoticePage />} />
        <Route path="/register/organization/verify" element={<OrgVerifyEmailPage />} />
        <Route path="/register/individual" element={<IndRegisterPage />} />

        <Route path="/admin/dashboard" element={
          <RequireAuth><RequireRole roles={['admin']}><GlobalLayout><AdminDashboard /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/admin/users" element={
          <RequireAuth><RequireRole roles={['admin']}><GlobalLayout><AdminUsersPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/admin/users/:id" element={
          <RequireAuth><RequireRole roles={['admin']}><GlobalLayout><AdminUserDetailPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/admin/tenders" element={
          <RequireAuth><RequireRole roles={['admin']}><GlobalLayout><AdminTendersPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/admin/auctions" element={
          <RequireAuth><RequireRole roles={['admin']}><GlobalLayout><AdminAuctionsPage /></GlobalLayout></RequireRole></RequireAuth>
        } />

        <Route path="/org/dashboard" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><OrgDashboard /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/org/chat" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><OrgChatPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/org/tenders" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><OrgTendersPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/org/proposals" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><OrgProposalsPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/org/reports" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><OrgReportsPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/org/profile" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><OrgProfilePage /></GlobalLayout></RequireRole></RequireAuth>
        } />

        <Route path="/dashboard" element={
          <RequireAuth><RequireRole roles={['individual']}><GlobalLayout><IndDashboard /></GlobalLayout></RequireRole></RequireAuth>
        } />

        <Route path="/tenders" element={
          <RequireAuth><GlobalLayout><TendersListPage /></GlobalLayout></RequireAuth>
        } />
        <Route path="/tenders/new" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><CreateTenderPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/tenders/:id" element={
          <RequireAuth><GlobalLayout><TenderDetailPage /></GlobalLayout></RequireAuth>
        } />
        <Route path="/tenders/:id/edit" element={
          <RequireAuth><RequireRole roles={['organization']}><GlobalLayout><EditTenderPage /></GlobalLayout></RequireRole></RequireAuth>
        } />

        <Route path="/auctions" element={<GlobalLayout><AuctionsListPage /></GlobalLayout>} />
        <Route path="/auctions/:id" element={<GlobalLayout><AuctionDetailPage /></GlobalLayout>} />
        <Route path="/auctions/new" element={
          <RequireAuth><RequireRole roles={['organization', 'admin']}><GlobalLayout><CreateAuctionPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/my-auctions" element={
          <RequireAuth><RequireRole roles={['individual']}><GlobalLayout><MyAuctionsPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/auctions/:id/payment" element={
          <RequireAuth><RequireRole roles={['individual']}><GlobalLayout><PaymentSimulationPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/proposals/:id" element={
          <RequireAuth><RequireRole roles={['organization', 'admin']}><GlobalLayout><ProposalDetailPage /></GlobalLayout></RequireRole></RequireAuth>
        } />
        <Route path="/proposals/:id/negotiation" element={
          <RequireAuth><GlobalLayout><NegotiationPage /></GlobalLayout></RequireAuth>
        } />

        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
