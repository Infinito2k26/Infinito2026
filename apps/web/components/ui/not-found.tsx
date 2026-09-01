import Link from "next/link"
import Button from "./button"
import { SearchX } from "lucide-react"
import styles from "./not-found.module.css"

interface NotFoundProps {
    title?: string
    description?: string
    backHref?: string
    backLabel?: string
    className?: string
}

export function NotFound({
    title = "Not found",
    description = "The resource you're looking for doesn't exist or has been moved.",
    backHref,
    backLabel,
    className,
}: NotFoundProps) {
    return (
        <div className={`${styles.wrapper} ${className ?? ""}`}>
            <div className={styles.iconCircle}>
                <SearchX size={24} />
            </div>
            <div className={styles.textGroup}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
            {backHref && backLabel && (
                <Link href={backHref} tabIndex={-1}>
                    <Button variant="ghost" className={styles.backBtn} tabIndex={0}>
                        {backLabel}
                    </Button>
                </Link>
            )}
        </div>
    )
}
