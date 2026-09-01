"use client";

import { usePathname } from "next/navigation";
import styles from "./page-fade.module.css";

/** Replays a fade+rise every time the route changes — keying on pathname
 * forces React to remount the div, which restarts the CSS animation. */
export default function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={styles.fade}>
      {children}
    </div>
  );
}
