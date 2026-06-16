import React from "react";
import Link from "next/link";
import styles from "./layout.module.css";

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footer_inner}>
                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Company</h3>
                    <Link href="/about" className={styles.footer_link}>About Us</Link>
                    <Link href="/careers" className={styles.footer_link}>Careers</Link>
                    <Link href="/blog" className={styles.footer_link}>Blog</Link>
                    <Link href="/contact" className={styles.footer_link}>Contact</Link>
                </div>

                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Resources</h3>
                    <Link href="/docs" className={styles.footer_link}>Documentation</Link>
                    <Link href="/guides" className={styles.footer_link}>Guides</Link>
                    <Link href="/tutorials" className={styles.footer_link}>Tutorials</Link>
                    <Link href="/community" className={styles.footer_link}>Community</Link>
                </div>

                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Support</h3>
                    <Link href="/help" className={styles.footer_link}>Help Center</Link>
                    <Link href="/faq" className={styles.footer_link}>FAQs</Link>
                    <Link href="/report" className={styles.footer_link}>Report Issue</Link>
                    <Link href="/status" className={styles.footer_link}>Status</Link>
                </div>

                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Legal</h3>
                    <Link href="/privacy" className={styles.footer_link}>Privacy Policy</Link>
                    <Link href="/terms" className={styles.footer_link}>Terms of Service</Link>
                    <Link href="/cookies" className={styles.footer_link}>Cookie Policy</Link>
                    <Link href="/disclaimer" className={styles.footer_link}>Disclaimer</Link>
                </div>
            </div>

            <div className={styles.footer_bottom}>
                <p className={styles.footer_bottom_text}>
                    © 2026 Infinito. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;