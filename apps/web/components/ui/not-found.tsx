import Link from "next/link"

interface NotFoundProps {
    title?: string
    description?: string
    backHref?: string
    backLabel?: string
    className?: string
}

export function NotFound({
    title = "Page not found",
    description = "The page you're looking for doesn't exist or has been moved.",
    backHref = "/",
    backLabel = "Back to home",
    className,
}: NotFoundProps) {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center gap-3 px-6 py-24 text-center ${className ?? ""
                }`}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                >
                    <circle cx="10" cy="10" r="7" />
                    <path d="m21 21-4.3-4.3" />
                    <path d="m8 8 4 4" />
                    <path d="m12 8-4 4" />
                </svg>
            </div>
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
            </div>
            <Link
                href={backHref}
                className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
                {backLabel}
            </Link>
        </div>
    )
}