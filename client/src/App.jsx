import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Toaster } from './components/ui/toaster';
import { AppShell } from './components/layout/AppShell';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Leads from './pages/crm/Leads';
import LeadDetail from './pages/crm/LeadDetail';
import Accounts from './pages/crm/Accounts';
import AccountDetail from './pages/crm/AccountDetail';
import Contacts from './pages/crm/Contacts';
import Opportunities from './pages/crm/Opportunities';
import OpportunityDetail from './pages/crm/OpportunityDetail';
import SalesFunnel from './pages/crm/SalesFunnel';
import Projects from './pages/projects/Projects';
import ProjectDetail from './pages/projects/ProjectDetail';
import MyTasks from './pages/tasks/MyTasks';
import Invoices from './pages/accounting/Invoices';
import InvoiceDetail from './pages/accounting/InvoiceDetail';
import Users from './pages/settings/Users';
import Profile from './pages/settings/Profile';

function RequireAuth({ children }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const user = useAuthStore(s => s.user);
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="accounts/:id" element={<AccountDetail />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />
          <Route path="sales-funnel" element={<SalesFunnel />} />

          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />

          <Route path="tasks" element={<MyTasks />} />

          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />

          <Route path="users" element={<RequireRole roles={['superadmin', 'project_manager']}><Users /></RequireRole>} />
          <Route path="settings/profile" element={<Profile />} />
          <Route path="settings" element={<Navigate to="/settings/profile" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
