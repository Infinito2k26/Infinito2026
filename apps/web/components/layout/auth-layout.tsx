import Image from "next/image";
import type { ReactNode } from "react";
import AshEmbers from "@/components/home/ash-embers";
import { ASH_EMBERS } from "./effects";
import Navbar from "./navbar";
import styles from "./auth-layout.module.css";

/**
 * The shared split layout for login, signup, and forgot-password: the form on
 * stone at left, the landing hero's fire giant at right, collapsing to a slim
 * banner above the form on mobile. Inside the `.ruins` scope like the rest of
 * the public site, so the inputs and buttons come out dark.
 *
 * The art is decorative here (the navbar carries the name), so it has no alt.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.shell} ruins`}>
      <Navbar tone="dark" />
      <div className={styles.artPanel}>
        <Image
          src="/hero-ragnarok.jpg"
          alt=""
          fill
          sizes="(max-width: 899px) 100vw, 42vw"
          quality={75}
          className={styles.art}
          priority
        />
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formSlot}>{children}</div>
      </div>
      {ASH_EMBERS && <AshEmbers />}
    </div>
  );
}
