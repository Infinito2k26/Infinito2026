import React from "react";
import styles from "./layout.module.css";

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footer_inner}>
                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Company</h3>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        About Us
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Careers
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Blog
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Contact
                    </a>
                </div>

                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Resources</h3>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Documentation
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Guides
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Tutorials
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Community
                    </a>
                </div>

                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Support</h3>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Help Center
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        FAQs
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Report Issue
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Status
                    </a>
                </div>

                <div className={styles.footer_column}>
                    <h3 className={styles.footer_title}>Legal</h3>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Privacy Policy
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Terms of Service
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Cookie Policy
                    </a>

                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.footer_link}
                    >
                        Disclaimer
                    </a>
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