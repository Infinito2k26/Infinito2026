import Button from "./button"

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
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                </svg>
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