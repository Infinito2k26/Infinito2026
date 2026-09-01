"use client"

import { useEffect, useState } from "react";
import styles from "./layout.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";


type SideItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

const InfinityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
    <path d="M18 8c-2.5 0-4 4-6 4s-3.5-4-6-4a4 4 0 0 0 0 8c2.5 0 4-4 6-4s3.5 4 6 4a4 4 0 0 0 0-8z" />
  </svg>
);
const LayoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const BarChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);
const QrCodeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><line x1="14" y1="14" x2="14" y2="14.01" />
    <line x1="21" y1="14" x2="21" y2="14.01" /><line x1="14" y1="21" x2="14" y2="21.01" />
    <line x1="21" y1="21" x2="21" y2="21.01" /><line x1="17.5" y1="17.5" x2="17.5" y2="17.51" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const SIDE_ITEMS: SideItem[] = [
  { label: "Dashboard", icon: <LayoutIcon />, href: "/dashboard" },
  { label: "Events",    icon: <CalendarIcon />, href: "/dashboard/events" },
  { label: "Teams",     icon: <UsersIcon />,   href: "/dashboard/teams" },
  { label: "My Credential", icon: <QrCodeIcon />, href: "/dashboard/credential" },
  { label: "My Orders", icon: <ShoppingBagIcon />, href: "/dashboard/orders" },
  { label: "Analytics", icon: <BarChartIcon />, href: "/dashboard/analytics" },
  { label: "Settings",  icon: <SettingsIcon />, href: "/dashboard/settings" },
];

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setIsAdmin(ADMIN_ROLES.has(res?.data?.role)))
      .catch(() => setIsAdmin(false));
  }, []);

  const handleLogout = async () => {
    try {
      await api.delete('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('infinito_token');
        router.push('/login');
      }
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* ── Infinito heading ── */}
      <div className={styles.fest}>
        <span className={styles.festMark}><InfinityIcon/></span>
        <span className={styles.festName}>Infinito</span>
      </div>

      {/* ── Sidebar links ── */}
      <nav className={styles.sidebarNav} >
        <ul className={styles.sidebarNavList}>
          {SIDE_ITEMS.map(({ label, icon, href }) => {
            const active = pathname === href;
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`${styles.sidebarLink} ${active ? styles.sidebarLinkActive : ""}`}
                >
                  <span className={styles.sidebarIcon}>
                    {icon}
                  </span>
                  <span className={styles.sidebarLabel}>{label}</span>
                  {active && (
                    <span className={styles.activePip} />
                  )}
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li key="Admin">
              <Link
                href="/admin"
                className={`${styles.sidebarLink} ${pathname.startsWith("/admin") ? styles.sidebarLinkActive : ""}`}
              >
                <span className={styles.sidebarIcon}>
                  <ShieldIcon />
                </span>
                <span className={styles.sidebarLabel}>Admin Panel</span>
              </Link>
            </li>
          )}
          <li key="Logout">
            <button
                className={styles.sidebarLink}
                onClick={handleLogout}
                style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                <span className={styles.sidebarIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </span>
                <span className={styles.sidebarLabel}>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
