import React from 'react';
import AshEmbers from '@/components/home/ash-embers';
import { ASH_EMBERS } from './effects';
import styles from './layout.module.css';
import Navbar from './navbar';
import Footer from './footer';

/**
 * The public site's shell: dark, inside the `.ruins` token scope (see
 * globals.css), so shared components come out on stone.
 *
 * `landing` is the home page only: its hero runs up under a transparent
 * navbar, and it ends on its own battlements, so the footer drops its ridge.
 * Every other page gets a solid navbar and the ridge above the footer.
 */
export default function PublicLayout({
  children,
  landing = false,
}: {
  children: React.ReactNode;
  landing?: boolean;
}) {
  return (
    <div className={`${styles.publicShell} ${styles.publicShellDark} ruins`}>
      <Navbar tone="dark" overHero={landing} />
      <main className={`${styles.publicMain} ${landing ? styles.publicMainLanding : ''}`}>
        {children}
      </main>
      <Footer tone="dark" ridge={!landing} />
      {ASH_EMBERS && <AshEmbers />}
    </div>
  );
}
