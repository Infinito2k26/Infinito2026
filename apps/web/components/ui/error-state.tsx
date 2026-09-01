import Button from "./button"
import { AlertTriangle } from "lucide-react"
import styles from "./error-state.module.css"

interface ErrorStateProps {
    title?: string
    description?: string
    onRetry?: () => void
    className?: string
}

export function ErrorState({
    title = "The path is broken",
    description = "That didn't load. Try again — if it keeps failing, the fest desk can help.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div className={`${styles.wrapper} ${className ?? ""}`}>
            <div className={styles.iconCircle}>
                <AlertTriangle size={24} />
            </div>
            <div className={styles.textGroup}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
            {onRetry && (
                <Button onClick={onRetry} size="sm" variant="secondary" className={styles.retryBtn}>
                    Try again
                </Button>
            )}
        </div>
    )
}
