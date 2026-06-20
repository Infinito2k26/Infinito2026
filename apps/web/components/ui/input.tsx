import React from "react";
import styles from "./input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const Input = ({
    label,
    error,
    hint,
    className,
    id,
    // children,
    ...rest
}: InputProps) => {
    const inputId = id ?? rest.name;

    return (
        <div className={styles.wrapper}>
            {label && (
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>
            )}

            <input
                id={inputId}
                className={`${styles.input} ${error ? styles.inputError : ""} ${className ?? ""}`}
                aria-invalid={error ? true : undefined}
                {...rest}
            />

            {error ? (
                <span className={styles.error}>{error}</span>
            ) : hint ? (
                <span className={styles.hint}>{hint}</span>
            ) : null}
        </div>
    );
};

export default Input;