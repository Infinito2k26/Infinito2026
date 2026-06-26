import Button from "./button"
import { AlertTriangle } from "lucide-react"

interface ErrorStateProps {
    title?: string
    description?: string
    onRetry?: () => void
    className?: string
}

export function ErrorState({
    title = "Something went wrong",
    description = "That didn't load. Please try again.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center ${className ?? ""
                }`}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
            </div>
            {onRetry && (
                <Button onClick={onRetry} size="sm" variant="secondary" className="mt-2">
                    Try again
                </Button>
            )}
        </div>
    )
}