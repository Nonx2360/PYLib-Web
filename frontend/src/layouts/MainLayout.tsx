import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Library, Users, BookOpen, ScanLine } from "lucide-react";

import { Button } from "../components/Button";
import { useAuthStore } from "../store/auth";
import styles from "./MainLayout.module.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: Library },
  { to: "/members", label: "Members", icon: Users },
  { to: "/inventory", label: "Inventory", icon: BookOpen },
  { to: "/loan", label: "Loan Terminal", icon: ScanLine },
];

export function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const activeTitle =
    navItems.find((item) => (item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)))?.label ??
    "Dashboard";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
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
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>{activeTitle}</h1>
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
