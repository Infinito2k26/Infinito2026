import Spinner from "./spinner"
import styles from "./page-spinner.module.css"

interface PageSpinnerProps {
    message?: string;
}

export function PageSpinner({ message = "Loading…" }: PageSpinnerProps) {
    return (
        <div className={styles.wrapper}>
            <Spinner size="lg" />
            <p className={styles.message}>{message}</p>
        </div>
    )
}
