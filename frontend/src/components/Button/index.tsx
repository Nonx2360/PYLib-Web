import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={clsx(styles.button, styles[variant], className)} {...props} />;
}
