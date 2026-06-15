import React from 'react';
import styles from './layout.module.css';
import Sidebar from './sidebar';
import BottomNav from './bottom-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.dashboardShell}>
      <Sidebar/>
      <main className={styles.dashboardMain}>
        {children}
      </main>
      <BottomNav/>
    </div>
  );
}