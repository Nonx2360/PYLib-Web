import { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { useStudentAuthStore } from "../store/studentAuth";
import styles from "./StudentLayout.module.css";

export function StudentLayout({ children }: PropsWithChildren) {
  const profile = useStudentAuthStore((state) => state.profile);
  const logout = useStudentAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.portalLabel}>Student Portal</p>
          <h1>{profile?.full_name ?? ""}</h1>
          <span className={styles.meta}>Member ID: {profile?.member_id ?? "-"}</span>
        </div>
        <Button onClick={handleLogout}>Logout</Button>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
