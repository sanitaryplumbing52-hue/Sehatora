import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ActivitiesPage } from "@/pages/ActivitiesPage";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { CompaniesPage } from "@/pages/CompaniesPage";
import { CompanyDetailPage } from "@/pages/CompanyDetailPage";
import { ContactDetailPage } from "@/pages/ContactDetailPage";
import { ContactsPage } from "@/pages/ContactsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DealsPage } from "@/pages/DealsPage";
import { LeadsPage } from "@/pages/LeadsPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { PipelinesPage } from "@/pages/PipelinesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TasksPage } from "@/pages/TasksPage";
import { TeamPage } from "@/pages/TeamPage";

const SOON_PATHS = [
  "/emails",
  "/whatsapp",
  "/calls",
  "/meetings",
  "/visitors",
  "/forms",
  "/tracking",
  "/campaigns",
  "/reports",
  "/automation",
  "/documents",
  "/products",
  "/quotes",
  "/tickets",
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="contacts" element={<ContactsPage />} />
        <Route path="contacts/:id" element={<ContactDetailPage />} />

        <Route path="companies" element={<CompaniesPage />} />
        <Route path="companies/:id" element={<CompanyDetailPage />} />

        <Route path="leads" element={<LeadsPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="pipelines" element={<PipelinesPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="activities" element={<ActivitiesPage />} />

        <Route path="team" element={<TeamPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {SOON_PATHS.map((path) => (
          <Route key={path} path={path.slice(1)} element={<ComingSoonPage />} />
        ))}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
