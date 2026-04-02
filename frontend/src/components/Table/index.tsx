import clsx from "clsx";
import { ReactNode } from "react";

import styles from "./Table.module.css";

interface TableProps {
  headers: string[];
  rows: ReactNode;
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className = clsx(styles.statusBadge, {
    [styles.statusBorrowed]: normalized === "borrowed",
    [styles.statusOverdue]: normalized === "overdue",
    [styles.statusReturned]: normalized === "returned",
  });
  return <span className={className}>{status}</span>;
}
