import React from "react";
import styles from "./button.module.css";
import Spinner from "./spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    children: React.ReactNode;
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: styles.primary ?? "",
    secondary: styles.secondary ?? "",
    ghost: styles.ghost ?? "",
    danger: styles.danger ?? "",
};

const SIZE_CLASS: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: styles.sm ?? "",
    md: styles.md ?? "",
    lg: styles.lg ?? "",
};

const Button = ({
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    children,
    ...rest
}: ButtonProps) => {
    const isDisabled = disabled || loading;

    return (
        <button
            className={`${styles.button ?? ""} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className ?? ""}`}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            {...rest}
        >
            {loading && (
                <span className={styles.spinnerSlot ?? ""}>
                    <Spinner size="sm" />
                </span>
            )}
            {children}
        </button>
    );
};

export default Button;