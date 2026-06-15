"use client"
import React, { useState } from "react";
import styles from "./layout.module.css";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbar_inner}>
                <div className={styles.navbar_list_left}>
                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navbar_item}
                    >
                        Home
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navbar_item}
                    >
                        Events
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navbar_item}
                    >
                        Sports
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navbar_item}
                    >
                        About
                    </a>
                </div>

                <div className={styles.navbar_list_right}>
                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navbar_item}
                        style={{ width: "80px" }}
                    >
                        Sign Up
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.navbar_item}
                    >
                        Login
                    </a>
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
            <div
                id="mobile-menu"
                className={`${styles.mobile_menu} ${menuOpen ? styles.mobile_menu_active : ""}`}
            >
                <a
                    href="https://google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobile_menu_item}
                    onClick={closeMenu}
                >
                    Home
                </a>

                <a
                    href="https://google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobile_menu_item}
                    onClick={closeMenu}
                >
                    Events
                </a>

                <a
                    href="https://google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobile_menu_item}
                    onClick={closeMenu}
                >
                    Sports
                </a>

                <a
                    href="https://google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobile_menu_item}
                    onClick={closeMenu}
                >
                    About
                </a>

                <a
                    href="https://google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobile_menu_item}
                    onClick={closeMenu}
                >
                    Sign Up
                </a>

                <a
                    href="https://google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobile_menu_item}
                    onClick={closeMenu}
                >
                    Login
                </a>
            </div>
        </nav>
    );
};

export default Navbar;