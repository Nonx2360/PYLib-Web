import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifyError, notifyInfo, notifySuccess } from "../../utils/alerts";

import api from "../../api/client";
import { Button } from "../../components/Button";
import { QRScanner } from "../../components/QRScanner";
import { Table } from "../../components/Table";
import styles from "./CheckInTerminal.module.css";

type MemberDetail = {
  member_id: string;
  full_name: string;
  member_type: string;
};

type CheckInEntry = {
  id: number;
  member_id: string;
  member_name: string;
  staff_username: string | null;
  method: string;
  created_at: string;
};

type ScanTarget = "member" | "totp";

export function CheckInTerminalPage() {
  const [memberId, setMemberId] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [scanTarget, setScanTarget] = useState<ScanTarget>("member");
  const queryClient = useQueryClient();
  const scannerErrorsRef = useRef<Map<string, number>>(new Map());

  const { data: member, isFetching: loadingMember } = useQuery<MemberDetail>({
    queryKey: ["member", "checkin", memberId],
    enabled: !!memberId,
    queryFn: async () => (await api.get(`/members/${memberId}`)).data,
  });

  const { data: checkins, isFetching: loadingCheckins } = useQuery<CheckInEntry[]>({
    queryKey: ["checkins", "today"],
    queryFn: async () => (await api.get("/checkins/today")).data,
    refetchInterval: 30_000,
  });

  const checkInMutation = useMutation({
    mutationFn: (payload: { member_id: string; code: string }) => api.post("/checkins", payload),
    onSuccess: async () => {
      notifySuccess("Check-in recorded");
      setTotpCode("");
      setScanTarget("member");
      await queryClient.invalidateQueries({ queryKey: ["checkins", "today"] });
    },
    onError: (error: any) => notifyError(error?.response?.data?.detail ?? "Unable to verify code"),
  });

  const currentScanLabel = useMemo(
    () => (scanTarget === "member" ? "Member card" : "TOTP / QR code"),
    [scanTarget]
  );

  const handleScan = (value: string) => {
    if (!value) return;
    if (scanTarget === "member") {
      setMemberId(value.trim());
      notifyInfo(`Member selected: ${value}`);
    } else {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      if (digits.length === 6) {
        setTotpCode(digits);
        notifyInfo("Captured passcode");
      } else {
        notifyError("Unable to read passcode");
      }
    }
  };

  const handleScannerError = (message: string) => {
    if (!message) return;
    if (message.includes("NotFoundException")) return;
    const normalized = message.trim();
    const now = Date.now();
    const lastShown = scannerErrorsRef.current.get(normalized);
    if (lastShown && now - lastShown < 12000) {
      return;
    }
    scannerErrorsRef.current.set(normalized, now);
    notifyError(normalized);
  };

  const handleCheckIn = () => {
    if (!memberId) {
      notifyError("Scan or enter a member ID first");
      return;
    }
    if (totpCode.length !== 6) {
      notifyError("Enter a valid 6-digit code");
      return;
    }
    checkInMutation.mutate({ member_id: memberId.trim(), code: totpCode.trim() });
  };

  const handleClear = () => {
    setMemberId("");
    setTotpCode("");
    setScanTarget("member");
  };

  return (
    <div>
      <div className={styles.container}>
        <section className={styles.panel}>
          <div className={styles.scanHeader}>
            <div>
              <h3 style={{ margin: 0 }}>Camera Scanner</h3>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem" }}>
                Start with the printed member card, then switch to capture their TOTP QR.
              </p>
            </div>
            <div className={styles.scanButtons}>
              {(
                [
                  { label: "Scan member", value: "member" },
                  { label: "Scan TOTP", value: "totp" },
                ] as { label: string; value: ScanTarget }[]
              ).map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={scanTarget === option.value ? "primary" : "secondary"}
                  onClick={() => setScanTarget(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <QRScanner onScan={handleScan} onError={handleScannerError} />
          <p style={{ color: "var(--color-muted)" }}>Current target: {currentScanLabel}</p>
        </section>
        <section className={styles.panel}>
          <h3 style={{ marginTop: 0 }}>Check-in Verification</h3>
          <label htmlFor="member_id">Member ID</label>
          <input
            id="member_id"
            value={memberId}
            placeholder="Scan card or type manually"
            onChange={(event) => setMemberId(event.target.value)}
          />
          <label htmlFor="totp_code">TOTP Code</label>
          <input
            id="totp_code"
            inputMode="numeric"
            maxLength={6}
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="Scan QR or type 6 digits"
          />
          {member && (
            <div className={styles.detailBox}>
              <strong>{member.full_name}</strong>
              <p style={{ margin: "0.35rem 0 0", color: "var(--color-muted)", fontSize: "0.9rem" }}>
                Type: {member.member_type}
              </p>
            </div>
          )}
          {loadingMember && <small>Loading member data...</small>}
          <div className={styles.actions}>
            <Button type="button" onClick={handleCheckIn} disabled={checkInMutation.isPending}>
              {checkInMutation.isPending ? "Verifying..." : "Verify & Check-in"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClear}>
              Clear
            </Button>
          </div>
          <p style={{ color: "var(--color-muted)", fontSize: "0.85rem", marginTop: "1rem" }}>
            If a student presents only the card, collect their rotating TOTP digits (or scan their phone QR)
            to finish authentication.
          </p>
        </section>
      </div>
      <section className={styles.logPanel}>
        <h3>Today&apos;s Check-ins</h3>
        <Table
          headers={["Time", "Member", "Handled By", "Method"]}
          rows={
            checkins && checkins.length > 0 ? (
              checkins.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.created_at).toLocaleTimeString()}</td>
                  <td>
                    <strong>{entry.member_name}</strong>
                    <br />
                    <span style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>{entry.member_id}</span>
                  </td>
                  <td>{entry.staff_username ?? "Door scanner"}</td>
                  <td>{entry.method.replace("_", " ")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>{loadingCheckins ? "Loading entries..." : "No check-ins yet."}</td>
              </tr>
            )
          }
        />
      </section>
    </div>
  );
}
