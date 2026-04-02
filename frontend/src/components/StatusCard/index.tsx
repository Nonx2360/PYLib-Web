import styles from "./StatusCard.module.css";

interface StatusCardProps {
  label: string;
  value: number | string;
  sparkline?: string;
}

export function StatusCard({ label, value, sparkline }: StatusCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {sparkline && <span className={styles.spark}>{sparkline}</span>}
    </div>
  );
}
