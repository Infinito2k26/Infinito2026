"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./layout.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: "Home",    href: "#home", icon: <HomeIcon /> },
  { label: "Events",  href: "#events",    icon: <CalendarIcon /> },
  { label: "Teams",   href: "#teams",     icon: <UsersIcon /> },
  { label: "Profile", href: "#profile",   icon: <ProfileIcon /> },
];

export default function BottomNav() {
  const [activeLabel, setActiveLabel] = useState("Home");

  return (
    <nav className={styles.bottomNav} >
      {NAV_ITEMS.map(({ label, href, icon }) => {
        const active = activeLabel === label;
        return (
          <Link
            key={label}
            href={href}
            className={`${styles.bottomNavItem} ${active ? styles.bottomNavItemActive : ""}`}
            onClick={() => setActiveLabel(label)}
          >
            <span className={styles.bottomNavIcon} >{icon}</span>
            <span className={styles.bottomNavLabel}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
