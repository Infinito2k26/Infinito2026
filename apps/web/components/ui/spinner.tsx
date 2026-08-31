import React from "react";
import styles from "./spinner.module.css";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    /** Announced to screen readers. Say what is loading where you can. */
    label?: string;
}

const SIZE: Record<NonNullable<SpinnerProps["size"]>, number> = {
    sm: 16,
    md: 24,
    lg: 40,
};

/**
 * A turning rune ring rather than the usual border-arc spinner — it carries the
 * key art's line-work idiom at the one moment every screen shows something.
 * The valknut itself stays still while the ring turns, so the mark reads even
 * at 16px inside a button.
 */
const Spinner = ({ size = "md", className, label = "Loading" }: SpinnerProps) => {
    const px = SIZE[size];

    return (
        <span
            role="status"
            className={`${styles.spinner} ${className ?? ""}`}
            style={{ width: px, height: px }}
        >
            <svg
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                className={styles.ring}
                data-motion="essential"
                aria-hidden="true"
            >
                <circle
                    cx="50"
                    cy="50"
                    r="44"
                    strokeWidth="7"
                    className={styles.track}
                />
                <circle
                    cx="50"
                    cy="50"
                    r="44"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="70 206"
                    className={styles.arc}
                />
            </svg>
            <span className={styles.srOnly}>{label}</span>
        </span>
    );
};

export default Spinner;
