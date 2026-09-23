import ScrollScene from "@/components/ui/scroll-scene";
import { SPORTS } from "@/lib/sports";
import styles from "./war-tape.module.css";

/**
 * Two crimson tapes slapped across the seam under the hero, crossing at an
 * angle, running the sport names in opposite directions as the page scrolls.
 * Decorative (the names are in the sports section proper), so aria-hidden.
 */

const NAMES = Array.from(new Set(SPORTS.map((s) => s.name)));

function Run() {
  return (
    <>
      {NAMES.map((name) => (
        <span key={name}>
          {name}
          <i />
        </span>
      ))}
    </>
  );
}

export default function WarTape() {
  return (
    <ScrollScene as="div" className={styles.tapes} aria-hidden="true">
      <div className={`${styles.tape} ${styles.back}`}>
        <div className={styles.run}>
          <Run />
          <Run />
          <Run />
        </div>
      </div>
      <div className={`${styles.tape} ${styles.front}`}>
        <div className={styles.run}>
          <Run />
          <Run />
          <Run />
        </div>
      </div>
    </ScrollScene>
  );
}
