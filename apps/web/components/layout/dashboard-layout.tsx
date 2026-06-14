import React from 'react';
import styles from './layout.module.css';
import Sidebar from './sidebar';
import BottomNav from './bottom-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.dashboardShell}>
      {/* TODO: Himanshi-Import and place <Sidebar/> here. Hide on mobile via CSS. */}
      <Sidebar/>
      <main className={styles.dashboardMain}>
        {children}
      </main>
      
      {/* TODO: Himanshi-Import and place <BottomNav/> here. Hide on desktop via CSS. */}
      <BottomNav/>
    </div>
  );
}