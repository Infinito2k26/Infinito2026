"use client"
import React, { useState } from "react";
import Link from "next/link";
import styles from "./layout.module.css";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbar_inner}>
                <div className={styles.navbar_list_left}>
                    <Link href="/" className={styles.navbar_item}>Home</Link>
                    <Link href="/events" className={styles.navbar_item}>Events</Link>
                    <Link href="/sports" className={styles.navbar_item}>Sports</Link>
                    <Link href="/about" className={styles.navbar_item}>About</Link>
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
                <Link href="/" className={styles.mobile_menu_item} onClick={closeMenu}>Home</Link>
                <Link href="/events" className={styles.mobile_menu_item} onClick={closeMenu}>Events</Link>
                <Link href="/sports" className={styles.mobile_menu_item} onClick={closeMenu}>Sports</Link>
                <Link href="/about" className={styles.mobile_menu_item} onClick={closeMenu}>About</Link>
                <Link href="/register" className={styles.mobile_menu_item} onClick={closeMenu}>Register</Link>
                <Link href="/login" className={styles.mobile_menu_item} onClick={closeMenu}>Login</Link>
            </div>
        </nav>
    );
};

export default Navbar;