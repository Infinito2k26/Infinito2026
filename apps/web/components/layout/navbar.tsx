"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Sports", href: "/sports" },
  { label: "Events", href: "/events" },
  { label: "About", href: "/about" },
  { label: "Team", href: "/team" },
  { label: "Sponsors", href: "/sponsors" },
  { label: "Gallery", href: "/gallery" },
  { label: "Merch", href: "/merch" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the panel on navigation, otherwise it stays open over the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // The panel covers the viewport on mobile; letting the page scroll behind it
  // is disorienting on a phone.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbar_inner}>
        <Link href="/" className={styles.brand} aria-label="Infinito 2026, home">
          <span className={styles.brandMark}>Infinito</span>
          <span className={styles.brandSub}>Ruins of Ragnarok</span>
        </Link>

        <div className={styles.navbar_list_left}>
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={`${styles.navbar_item} ${
                isActive(href) ? styles.navbar_item_active : ""
              }`}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className={styles.navbar_list_right}>
          <Link href="/login" className={styles.navbar_item}>
            Login
          </Link>
          <Link href="/signup" className={styles.navbar_signup}>
            Register
          </Link>
        </div>

        <button
          className={`${styles.hamburger} ${
            menuOpen ? styles.hamburger_active : ""
          }`}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`${styles.mobile_menu} ${
          menuOpen ? styles.mobile_menu_active : ""
        }`}
        hidden={!menuOpen}
      >
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className={`${styles.mobile_menu_item} ${
              isActive(href) ? styles.mobile_menu_item_active : ""
            }`}
            aria-current={isActive(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
        <div className={styles.mobile_menu_actions}>
          <Link href="/login" className={styles.mobile_menu_login}>
            Login
          </Link>
          <Link href="/signup" className={styles.mobile_menu_register}>
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
