import React from "react";
import styles from "./card.module.css";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
}

const PADDING_CLASS: Record<NonNullable<CardProps["padding"]>, string> = {
    none: styles.none ?? "",
    sm: styles.sm ?? "",
    md: styles.md ?? "",
    lg: styles.lg ?? "",
};

const Card = ({ children, className, padding = "md" }: CardProps) => {
    return (
        <div className={`${styles.card ?? ""} ${PADDING_CLASS[padding]} ${className ?? ""}`}>
            {children}
        </div>
    );
};

export default Card;