import React from 'react';
import styles from './layout.module.css';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.publicShell}>
      {/* TODO: Jamanrao-Import and place <Navbar/> here */}
      
      <main className={styles.publicMain}>
        {children}
      </main>
      
      {/* TODO: Jamanrao-Import and place <Footer/> here */}
    </div>
  );
}