import React from 'react';
import styles from './layout.module.css';
import Navbar from './navbar';
import Footer from './footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.publicShell}>
      
      <Navbar/>
      <main className={styles.publicMain}>
        {children}
      </main>
      
      {/* TODO: Jamanrao-Import and place <Footer/> here */}
      <Footer/>
    </div>
  );
}