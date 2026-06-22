import React from "react";
import styles from "./spinner.module.css";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const SIZE_CLASS: Record<NonNullable<SpinnerProps["size"]>, string> = {
    sm: styles.sm ?? "",
    md: styles.md ?? "",
    lg: styles.lg ?? "",
};

const Spinner = ({ size = "md", className }: SpinnerProps) => {
    return (
        <span
            role="status"
            className={`${styles.spinner ?? ""} ${SIZE_CLASS[size]} ${className ?? ""}`}
        >
            <span className={styles.srOnly ?? ""}>Loading</span>
        </span>
    );
};

export default Spinner;