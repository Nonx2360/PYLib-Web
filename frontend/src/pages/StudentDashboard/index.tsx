import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import studentApi from "../../api/studentClient";
import { Button } from "../../components/Button";
import styles from "./StudentDashboard.module.css";

type TotpResponse = {
  code: string;
  expires_in: number;
};

type StudentLoan = {
  id: number;
  book_id: string;
  title: string;
  due_date: string;
  return_date: string | null;
  status: "borrowed" | "returned" | "overdue";
  days_overdue: number;
};

type LoanSummary = {
  loans: StudentLoan[];
  overdue_count: number;
  active_count: number;
};

export function StudentDashboardPage() {
  const [remaining, setRemaining] = useState(0);

  const totpQuery = useQuery<TotpResponse>({
    queryKey: ["student", "totp"],
    queryFn: async () => (await studentApi.get("/student/totp")).data,
    refetchInterval: 30_000,
  });

  const loansQuery = useQuery<LoanSummary>({
    queryKey: ["student", "loans"],
    queryFn: async () => (await studentApi.get("/student/loans")).data,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (totpQuery.data) {
      setRemaining(totpQuery.data.expires_in);
    }
  }, [totpQuery.data]);

  useEffect(() => {
    if (!totpQuery.data) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [totpQuery.data]);

  useEffect(() => {
    if (totpQuery.error) {
      toast.error("Unable to refresh passcode");
    }
    if (loansQuery.error) {
      toast.error("Unable to load borrowed books");
    }
  }, [totpQuery.error, loansQuery.error]);

  const digits = useMemo(() => {
    if (!totpQuery.data?.code) return [];
    return totpQuery.data.code.padStart(6, "0").split("");
  }, [totpQuery.data]);

  const handleRefreshCode = () => {
    totpQuery.refetch();
  };

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <section className={styles.card}>
          <h2>Door Check-in</h2>
          <p style={{ color: "var(--color-muted)", margin: 0 }}>
            Present this 6-digit passcode or let the guard scan the QR within {remaining}s.
          </p>
          <div className={styles.totpDigits}>
            {digits.length === 6
              ? digits.map((digit, index) => (
                  <div key={`${digit}-${index}`} className={styles.digitBox}>
                    {digit}
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className={styles.digitBox}>
                    ·
                  </div>
                ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className={styles.timer}>New code in {remaining}s</span>
            <Button variant="secondary" onClick={handleRefreshCode} disabled={totpQuery.isLoading}>
              Refresh
            </Button>
          </div>
        </section>
        <section className={styles.card}>
          <h3 style={{ marginTop: 0 }}>Scan-ready QR</h3>
          <p style={{ color: "var(--color-muted)", marginTop: 0 }}>
            The QR only contains your current passcode, as requested by the security team.
          </p>
          <div className={styles.qrWrapper}>
            {totpQuery.data?.code ? (
              <QRCode value={totpQuery.data.code} fgColor="#ffffff" bgColor="transparent" size={180} />
            ) : (
              <p style={{ color: "var(--color-muted)" }}>Generating code...</p>
            )}
          </div>
        </section>
      </div>
      <section className={styles.card}>
        <h2 style={{ marginTop: 0 }}>My Borrowed Books</h2>
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <p className={styles.statLabel}>Active loans</p>
            <span className={styles.statValue}>{loansQuery.data?.active_count ?? 0}</span>
          </div>
          <div className={styles.statBox}>
            <p className={styles.statLabel}>Overdue items</p>
            <span className={styles.statValue} style={{ color: loansQuery.data?.overdue_count ? "#ff8366" : undefined }}>
              {loansQuery.data?.overdue_count ?? 0}
            </span>
          </div>
        </div>
        <div className={styles.loansList}>
          {loansQuery.data?.loans && loansQuery.data.loans.length > 0 ? (
            loansQuery.data.loans.map((loan) => {
              const dueDate = new Date(loan.due_date).toLocaleDateString();
              const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString() : null;
              const statusClass =
                loan.status === "overdue"
                  ? styles.statusOverdue
                  : loan.status === "returned"
                  ? styles.statusReturned
                  : styles.statusBorrowed;
              return (
                <div key={loan.id} className={styles.loanItem}>
                  <div>
                    <h4 className={styles.loanTitle}>{loan.title}</h4>
                    <p className={styles.loanMeta}>Book ID: {loan.book_id}</p>
                    {loan.status === "returned" && returnDate && <p className={styles.loanMeta}>Returned on {returnDate}</p>}
                    {loan.status !== "returned" && (
                      <p className={styles.loanMeta}>
                        Due {dueDate}
                        {loan.days_overdue > 0 && ` · Overdue by ${loan.days_overdue} day${loan.days_overdue === 1 ? "" : "s"}`}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`${styles.statusBadge} ${statusClass}`}>{loan.status}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              {loansQuery.isFetching ? "Loading your loans..." : "No borrowed books yet."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
