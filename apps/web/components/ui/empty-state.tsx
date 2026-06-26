import type { ReactNode } from "react"
import { Inbox } from "lucide-react";
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
                    <Inbox className="h-12 w-12 text-gray-400 mb-4" />
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
                <Button variant="primary" onClick={action.onClick} size="sm" className="mt-2">
                    {action.label}
                </Button>
            )}
        </div>
    )
}