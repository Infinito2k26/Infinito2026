"use client"
import React, { useState } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

const NAV_ITEMS = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events', status: 'Upcoming' },
    { label: 'Sports', href: '/sports', status: 'Upcoming' },
    { label: 'About', href: '/about', status: 'Upcoming' },
];

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbar_inner}>
                <div className={styles.navbar_list_left}>
                    {NAV_ITEMS.map(({ label, href, status }) => (
                        <Link 
                            key={label}
                            href={href} 
                            className={styles.navbar_item}
                            onClick={(e) => {
                                if (status) {
                                    e.preventDefault();
                                }
                            }}
                            style={status ? { opacity: 0.6, cursor: "not-allowed", display: 'flex', alignItems: 'center', gap: '4px' } : {}}
                        >
                            {label}
                            {status && (
                                <span style={{ fontSize: "0.6rem", background: "#f59e0b", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                                    {status}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                <div className={styles.navbar_list_right}>
                    <Link href="/register" className={`${styles.navbar_item} ${styles.navbar_signup}`}>Register</Link>
                    <Link href="/login" className={styles.navbar_item}>Login</Link>
                </div>

                <button
                    className={`${styles.hamburger} ${menuOpen ? styles.hamburger_active : ""}`}
                    type="button"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                    onClick={toggleMenu}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            
            <div id="mobile-menu" className={`${styles.mobile_menu} ${menuOpen ? styles.mobile_menu_active : ""}`}>
                {NAV_ITEMS.map(({ label, href, status }) => (
                    <Link 
                        key={label}
                        href={href} 
                        className={styles.mobile_menu_item} 
                        onClick={(e) => {
                            if (status) {
                                e.preventDefault();
                                return;
                            }
                            closeMenu();
                        }}
                        style={status ? { opacity: 0.6, cursor: "not-allowed", display: 'flex', alignItems: 'center', gap: '8px' } : {}}
                    >
                        {label}
                        {status && (
                            <span style={{ fontSize: "0.6rem", background: "#f59e0b", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                                {status}
                            </span>
                        )}
                    </Link>
                ))}
                <Link href="/register" className={styles.mobile_menu_item} onClick={closeMenu}>Register</Link>
                <Link href="/login" className={styles.mobile_menu_item} onClick={closeMenu}>Login</Link>
            </div>
        </nav>
    );
};

export default Navbar;