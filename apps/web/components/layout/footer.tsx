import Link from "next/link";
import Ornament from "@/components/ui/ornament";
import styles from "./layout.module.css";

/**
 * The footer is the page's last dark band — the ruin the bone sky sits on.
 *
 * Contacts and the Instagram handle are carried over from the teaser site, which
 * is where people currently find them. The previous footer here was SaaS
 * boilerplate (Careers, Blog, Documentation, Status) for a college sports fest
 * that has none of those things.
 */

const SPORTS_LINKS = [
  { label: "All sports", href: "/sports" },
  { label: "Events", href: "/events" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Campus Ambassador", href: "/dashboard/ca" },
];

const FEST_LINKS = [
  { label: "About Infinito", href: "/about" },
  { label: "Register", href: "/register" },
  { label: "Login", href: "/login" },
];

const LEGAL_LINKS = [
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms and conditions", href: "/terms-and-conditions" },
];

const CONTACTS = [
  { role: "RSP Sub Coordinator", name: "Banshidhar", phone: "8521323680" },
  { role: "RSP Sub Coordinator", name: "Rajendra", phone: "8955513963" },
];

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Ornament variant="ridge" fill="var(--char-900)" className={styles.footerRidge} />

      <div className={styles.footer_inner}>
        <div className={styles.footer_column}>
          <span className={styles.footerBrand}>Infinito 2026</span>
          <p className={styles.footerTagline}>
            Ruins of Ragnarok · 11th edition
            <br />
            IIT Patna · 9–11 October 2026
          </p>
          <a
            href="https://instagram.com/infinito_iitp"
            className={styles.footer_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            @infinito_iitp
          </a>
        </div>

        <div className={styles.footer_column}>
          <h3 className={styles.footer_title}>Compete</h3>
          {SPORTS_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className={styles.footer_link}>
              {label}
            </Link>
          ))}
        </div>

        <div className={styles.footer_column}>
          <h3 className={styles.footer_title}>The fest</h3>
          {FEST_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className={styles.footer_link}>
              {label}
            </Link>
          ))}
          {LEGAL_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className={styles.footer_link}>
              {label}
            </Link>
          ))}
        </div>

        <div className={styles.footer_column}>
          <h3 className={styles.footer_title}>Need assistance?</h3>
          {CONTACTS.map(({ role, name, phone }) => (
            <a key={name} href={`tel:+91${phone}`} className={styles.footerContact}>
              <span className={styles.footerContactRole}>{role}</span>
              <span className={styles.footerContactName}>{name}</span>
              <span className={styles.footerContactPhone}>
                {phone.slice(0, 5)} {phone.slice(5)}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className={styles.footer_bottom}>
        <p className={styles.footer_bottom_text}>
          © {new Date().getFullYear()} Infinito, IIT Patna. All rights reserved.
        </p>
        <p className={styles.footer_bottom_text}>From the ruins, we rise.</p>
      </div>
    </footer>
  );
};

export default Footer;
