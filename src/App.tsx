import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from '@/i18n/I18nContext';
import { AuthProvider } from '@/state/auth';
import { ToastProvider } from '@/state/toast';
import { initTheme } from '@/utils/theme';
import AppShell from '@/components/AppShell';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Students from '@/pages/Students';
import Academic from '@/pages/Academic';
import Finance from '@/pages/Finance';
import StaffPage from '@/pages/Staff';
import Discipline from '@/pages/Discipline';
import Messages from '@/pages/Messages';
import Reports from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import Teaching from '@/pages/Teaching';
import Family from '@/pages/Family';
import Tasks from '@/pages/Tasks';

initTheme();

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="academic" element={<Academic />} />
                <Route path="finance" element={<Finance />} />
                <Route path="staff" element={<StaffPage />} />
                <Route path="discipline" element={<Discipline />} />
                <Route path="messages" element={<Messages />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="teaching" element={<Teaching />} />
                <Route path="family" element={<Family />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
