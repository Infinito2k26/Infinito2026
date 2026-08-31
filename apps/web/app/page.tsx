import PublicLayout from "@/components/layout/public-layout";
import Link from "next/link";
import Button from "@/components/ui/button";
import styles from "./home.module.css";

export default function Home() {
  return (
    <PublicLayout>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.accent}>Infinito 2K26</span>
        </h1>
        <p className={styles.subtitle}>
          Join the biggest sports fest of Eastern India. Experience the thrill, the passion, and the infinity of sports!
        </p>
        <div className={styles.actions}>
            <Link href="/events">
                <Button variant="secondary" size="lg">
                    Browse Events
                </Button>
            </Link>
        </div>
      </div>
    </PublicLayout>
  );
}