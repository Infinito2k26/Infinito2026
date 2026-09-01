import Spinner from "./spinner"
import styles from "./section-spinner.module.css"

interface SectionSpinnerProps {
    message?: string;
    minHeight?: string;
    className?: string
}

export function SectionSpinner({ message, minHeight = "200px", className }: SectionSpinnerProps) {
    return (
        <div
            className={`${styles.wrapper} ${className ?? ""}`}
            style={{ minHeight }}
        >
            <Spinner size="md" />
            {message && <p className={styles.message}>{message}</p>}
        </div>
    )
}
