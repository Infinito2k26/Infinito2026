import ScrollScene from "@/components/ui/scroll-scene";
import { SPORTS } from "@/lib/sports";
import styles from "./war-tape.module.css";

/**
 * A ticker under the hero, like the fixture board at the ground: every sport's
 * name, drifting sideways as the page scrolls. Decorative (the names are in
 * the sports section proper), so aria-hidden.
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
    <ScrollScene as="div" className={styles.tape} aria-hidden="true">
      <div className={styles.run}>
        <Run />
        <Run />
        <Run />
      </div>
    </ScrollScene>
  );
}
