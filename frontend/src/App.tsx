import { Navigate, Outlet, useRoutes } from "react-router-dom";

import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { StudentLayout } from "./layouts/StudentLayout";
import { DashboardPage } from "./pages/Dashboard";
import { CheckInTerminalPage } from "./pages/CheckInTerminal";
import { InventoryPage } from "./pages/Inventory";
import { LoanTerminalPage } from "./pages/LoanTerminal";
import { MemberManagementPage } from "./pages/MemberManagement";
import { LoginPage } from "./pages/Login";
import { StudentLoginPage } from "./pages/StudentLogin";
import { StudentDashboardPage } from "./pages/StudentDashboard";
import { useAuthStore } from "./store/auth";
import { useStudentAuthStore } from "./store/studentAuth";

function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/staff/login" replace />;
  return <Outlet />;
}

function AuthRoute() {
  const user = useAuthStore((state) => state.user);
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function StudentProtectedRoute() {
  const profile = useStudentAuthStore((state) => state.profile);
  if (!profile) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function StudentAuthRoute() {
  const profile = useStudentAuthStore((state) => state.profile);
  if (profile) return <Navigate to="/student" replace />;
  return <Outlet />;
}

export default function App() {
  const element = useRoutes([
    {
      element: <StudentAuthRoute />,
      children: [
        {
          path: "/login",
          element: (
            <AuthLayout>
              <StudentLoginPage />
            </AuthLayout>
          ),
        },
      ],
    },
    {
      element: <AuthRoute />,
      children: [
        {
          path: "/staff/login",
          element: (
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          ),
        },
      ],
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <MainLayout />,
          children: [
            { index: true, element: <DashboardPage /> },
            { path: "/members", element: <MemberManagementPage /> },
            { path: "/inventory", element: <InventoryPage /> },
            { path: "/loan", element: <LoanTerminalPage /> },
            { path: "/checkin", element: <CheckInTerminalPage /> },
          ],
        },
      ],
    },
    {
      element: <StudentProtectedRoute />,
      children: [
        {
          path: "/student",
          element: (
            <StudentLayout>
              <StudentDashboardPage />
            </StudentLayout>
          ),
        },
      ],
    },
    { path: "*", element: <Navigate to="/login" replace /> },
  ]);

  return element;
}
