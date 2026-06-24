import type { ReactNode } from "react"
import Button from "./button"

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
        <div
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center ${className ?? ""
                }`}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                {icon ?? (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                    >
                        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                {description && (
                    <p className="max-w-sm text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <Button onClick={action.onClick} size="sm" className="mt-2">
                    {action.label}
                </Button>
            )}
        </div>
    )
}