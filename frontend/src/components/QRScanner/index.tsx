import { useEffect, useRef } from "react";

import styles from "./QRScanner.module.css";

interface QRScannerProps {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const elementIdRef = useRef(`qr-scanner-${Math.random().toString(36).slice(2, 10)}`);
  const elementId = elementIdRef.current;

  useEffect(() => {
    let isMounted = true;
    let scanner: any;

    async function init() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      scanner = new Html5QrcodeScanner(elementId, { fps: 10, qrbox: 200 }, false);
      scanner.render(
        (value: string) => {
          if (isMounted) onScan(value);
          scanner?.clear?.().catch(() => {});
        },
        (error: string) => onError?.(error)
      );
    }

    init();

    return () => {
      isMounted = false;
      scanner?.clear?.().catch(() => {});
    };
  }, [elementId, onScan, onError]);

  return (
    <div className={styles.wrapper}>
      <div id={elementId} className={styles.container}></div>
    </div>
  );
}
