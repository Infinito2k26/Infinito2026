import Spinner from "./spinner"

interface PageSpinnerProps {
    message?: string;
}

export function PageSpinner({ message = "Loading…" }: PageSpinnerProps) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
            <Spinner size="lg" className="text-primary" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    )
}