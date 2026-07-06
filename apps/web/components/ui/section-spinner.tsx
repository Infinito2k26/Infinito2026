import Spinner from "./spinner"

interface SectionSpinnerProps {
    message?: string;
    minHeight?: string;
    className?: string
}

export function SectionSpinner({message,minHeight = "200px", className }: SectionSpinnerProps) {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center gap-2 py-12 ${className ?? ""}`}
            style={{minHeight}}
        >
            <Spinner size="md" className="text-primary" />
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
    )
}