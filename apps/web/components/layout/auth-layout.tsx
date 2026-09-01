import Image from "next/image";
import type { ReactNode } from "react";
import Navbar from "./navbar";
import styles from "./auth-layout.module.css";

/**
 * The shared split layout for login, signup, forgot-password and
 * reset-password: form on bone at left, a cropped poster at right that
 * collapses to a slim banner above the form on mobile.
 *
 * `main-mobile.png` is reused here rather than a sport poster — its 4:5
 * portrait crop fills a tall side panel cleanly, and like the landing hero it
 * already carries the wordmark and dates as pixels, so nothing is ever drawn
 * over it.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Navbar />
      <div className={styles.artPanel}>
        <Image
          src="/main-mobile.png"
          alt="Infinito 2026, Ruins of Ragnarok, IIT Patna, 9–11 October 2026"
          fill
          sizes="(max-width: 899px) 100vw, 42vw"
          className={styles.art}
          priority
        />
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formSlot}>{children}</div>
      </div>
    </div>
  );
}
