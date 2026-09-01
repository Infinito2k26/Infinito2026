import React from "react";
import { AlertCircle } from "lucide-react";
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
    ...rest
}: InputProps) => {
    const inputId = id ?? rest.name;
    // Without this the message is visible but unannounced — screen readers get
    // the invalid state and no reason for it.
    const messageId = inputId ? `${inputId}-message` : undefined;

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
                aria-describedby={(error || hint) && messageId ? messageId : undefined}
                {...rest}
            />

            {error ? (
                <span id={messageId} className={styles.error}>
                    <AlertCircle size={15} className={styles.errorIcon} aria-hidden="true" />
                    {error}
                </span>
            ) : hint ? (
                <span id={messageId} className={styles.hint}>
                    {hint}
                </span>
            ) : null}
        </div>
    );
};

export default Input;
