"use client"

import { useEffect } from "react"
import { ErrorState } from "@/components/ui/error-state"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', backgroundColor: 'var(--color-bg-primary)' }}>
            <ErrorState onRetry={reset} />
        </div>
    )
}