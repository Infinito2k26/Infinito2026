import React from 'react';
import styles from './layout.module.css';
import Navbar from './navbar';
import Footer from './footer';

/**
 * `tone="dark"` is the landing page only: the hero runs up under a transparent
 * navbar and the page ends on the abyss instead of the bone ridge. Every other
 * public page keeps the light shell.
 */
export default function PublicLayout({
  children,
  tone = 'light',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';

  return (
    <div className={`${styles.publicShell} ${dark ? styles.publicShellDark : ''}`}>
      <Navbar tone={tone} />
      <main className={`${styles.publicMain} ${dark ? styles.publicMainDark : ''}`}>
        {children}
      </main>
      <Footer tone={tone} />
    </div>
  );
}
