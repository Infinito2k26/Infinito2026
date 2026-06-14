"use client"

import { useState } from "react";
import styles from "./layout.module.css";
import Link from "next/link";


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
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SIDE_ITEMS: SideItem[] = [
  { label: "Dashboard", icon: <LayoutIcon />, href: "#dashboard" },
  { label: "Events",    icon: <CalendarIcon />, href: "#events" },
  { label: "Teams",     icon: <UsersIcon />,   href: "#teams" },
  { label: "Analytics", icon: <BarChartIcon />, href: "#analytics" },
  { label: "Settings",  icon: <SettingsIcon />, href: "#settings" },
];

export default function Sidebar() {
  const [activeLabel, setActiveLabel] = useState("Dashboard");

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
            const active = activeLabel === label;
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`${styles.sidebarLink} ${active ? styles.sidebarLinkActive : ""}`}
                  onClick={() => setActiveLabel(label)}
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
        </ul>
      </nav>
    </aside>
  );
}
