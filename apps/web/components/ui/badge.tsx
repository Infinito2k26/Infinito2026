import React from "react";
import styles from "./badge.module.css";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "info";
}

const VARIANT_CLASS: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: styles.default ?? "",
    success: styles.success ?? "",
    warning: styles.warning ?? "",
    danger: styles.danger ?? "",
    info: styles.info ?? "",
};

const Badge = ({ children, variant = "default" }: BadgeProps) => {
    return (
        <span className={`${styles.badge ?? ""} ${VARIANT_CLASS[variant]}`}>
            {children}
        </span>
    );
};

export default Badge;