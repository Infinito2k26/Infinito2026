import React from 'react';
import { Award, Shirt, Ticket } from 'lucide-react';
import styles from './styles.module.css';

export function CAHeroSection() {
  return (
    <div className={styles.heroSection}>
      <h1 className={styles.heroTitle}>Become a Campus Ambassador</h1>
      <p className={styles.heroSubtitle}>
        Represent Infinito in your college, lead the sports spirit, and unlock exclusive perks!
      </p>
      
      <ul className={styles.perksList}>
        <li className={styles.perkItem}>
          <Award className={styles.perkIcon} size={24} />
          <span>Official Certificate of Excellence</span>
        </li>
        <li className={styles.perkItem}>
          <Shirt className={styles.perkIcon} size={24} />
          <span>Exclusive Infinito Merchandise</span>
        </li>
        <li className={styles.perkItem}>
          <Ticket className={styles.perkIcon} size={24} />
          <span>Free Pro-Night Passes</span>
        </li>
      </ul>
    </div>
  );
}
