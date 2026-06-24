import Spinner from "./spinner"

interface SectionSpinnerProps {
    label?: string
    className?: string
}

export function SectionSpinner({ label, className }: SectionSpinnerProps) {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center gap-2 py-12 ${className ?? ""
                }`}
        >
            <Spinner className="h-6 w-6 text-primary" />
            {label && <p className="text-sm text-muted-foreground">{label}</p>}
        </div>
    )
}