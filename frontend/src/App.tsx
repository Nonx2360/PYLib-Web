import { Navigate, Outlet, useRoutes } from "react-router-dom";

import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { DashboardPage } from "./pages/Dashboard";
import { InventoryPage } from "./pages/Inventory";
import { LoanTerminalPage } from "./pages/LoanTerminal";
import { MemberManagementPage } from "./pages/MemberManagement";
import { LoginPage } from "./pages/Login";
import { useAuthStore } from "./store/auth";

function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AuthRoute() {
  const user = useAuthStore((state) => state.user);
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  const element = useRoutes([
    {
      element: <AuthRoute />,
      children: [
        {
          path: "/login",
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
          ],
        },
      ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ]);

  return element;
}
