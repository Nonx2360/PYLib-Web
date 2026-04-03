import clsx from "clsx";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Library, Users, BookOpen, ScanLine, LogIn, Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { useAuthStore } from "../store/auth";
import styles from "./MainLayout.module.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: Library },
  { to: "/checkin", label: "Check-in", icon: LogIn },
  { to: "/members", label: "Members", icon: Users },
  { to: "/inventory", label: "Inventory", icon: BookOpen },
  { to: "/loan", label: "Loan Terminal", icon: ScanLine },
];

export function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 900) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 900) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const activeTitle =
    navItems.find((item) => (item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)))?.label ??
    "Dashboard";

  const handleLogout = () => {
    logout();
    navigate("/staff/login");
  };

  return (
    <div className={clsx(styles.wrapper, !sidebarOpen && styles.wrapperCollapsed)}>
      <aside className={clsx(styles.sidebar, !sidebarOpen && styles.sidebarCollapsed)}>
        <Link to="/" className={styles.logo}>
          Smart Library
        </Link>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeLink : ""}`
              }
              end={item.to === "/"}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={clsx(styles.scrim, sidebarOpen && styles.scrimVisible)} onClick={() => setSidebarOpen(false)} />
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="button"
              variant="secondary"
              className={styles.menuButton}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <Menu size={16} />
              {sidebarOpen ? "Hide menu" : "Menu"}
            </Button>
            <h1>{activeTitle}</h1>
          </div>
          <div>
            <span className={styles.avatar}>{user?.username.at(0)?.toUpperCase()}</span>
            <Button style={{ marginLeft: "0.75rem" }} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
