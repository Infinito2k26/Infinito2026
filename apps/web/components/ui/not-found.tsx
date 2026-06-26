import Link from "next/link"
import Button from "./button"
import { SearchX } from "lucide-react"

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
        <div
            className={`flex w-full flex-col items-center justify-center gap-3 px-6 py-24 text-center ${className ?? ""
                }`}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SearchX className="h-12 w-12 text-gray-400 mb-4" />
            </div>
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
            </div>
            {backHref && backLabel && (
                <Link href={backHref} tabIndex={-1}>
                    <Button variant="ghost" className="mt-2" tabIndex={0}>
                        {backLabel}
                    </Button>
                </Link>
            )}
        </div>
    )
}