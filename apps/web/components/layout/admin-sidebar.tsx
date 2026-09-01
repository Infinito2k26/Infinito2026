"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import styles from "./layout.module.css";

type AdminItem = {
  label: string;
  href: string;
};

const ADMIN_ITEMS: AdminItem[] = [
  { label: "Registrations", href: "/admin/registrations" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Events", href: "/admin/events" },
  { label: "Teams", href: "/admin/teams" },
  { label: "Gate Scans", href: "/admin/scans" },
  { label: "CA Applications", href: "/admin/ca-applications" },
  { label: "CA Tasks", href: "/admin/ca-tasks" },
  { label: "Team", href: "/admin/content/team" },
  { label: "Sponsors", href: "/admin/content/sponsors" },
  { label: "Gallery", href: "/admin/content/gallery" },
  { label: "Merch Products", href: "/admin/merch/products" },
  { label: "Merch Orders", href: "/admin/merch/orders" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.delete("/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("infinito_token");
        router.push("/login");
      }
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.fest}>
        <span className={styles.festName}>Admin</span>
      </div>

      <nav className={styles.sidebarNav}>
        <ul className={styles.sidebarNavList}>
          <li>
            <Link
              href="/dashboard"
              className={styles.sidebarLink}
            >
              <span className={styles.sidebarLabel}>← Back to Dashboard</span>
            </Link>
          </li>
          {ADMIN_ITEMS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`${styles.sidebarLink} ${active ? styles.sidebarLinkActive : ""}`}
                >
                  <span className={styles.sidebarLabel}>{label}</span>
                  {active && <span className={styles.activePip} />}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              className={styles.sidebarLink}
              onClick={handleLogout}
              style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <span className={styles.sidebarLabel}>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
