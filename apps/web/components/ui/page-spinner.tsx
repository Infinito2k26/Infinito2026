import Spinner from "./spinner"

export function PageSpinner() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
            <Spinner className="h-10 w-10 text-primary" />
            <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
    )
}