import type { ReactNode } from "react"
import { Inbox } from "lucide-react";
import Button from "./button"
import styles from "./empty-state.module.css"

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={`${styles.wrapper} ${className ?? ""}`}>
            <div className={styles.iconCircle}>
                {icon ?? <Inbox size={24} />}
            </div>
            <div className={styles.textGroup}>
                <h3 className={styles.title}>{title}</h3>
                {description && <p className={styles.description}>{description}</p>}
            </div>
            {action && (
                <Button variant="primary" onClick={action.onClick} size="sm" className={styles.actionBtn}>
                    {action.label}
                </Button>
            )}
        </div>
    )
}
