import { PropsWithChildren } from "react";

import styles from "./AuthLayout.module.css";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>{children}</div>
    </div>
  );
}
