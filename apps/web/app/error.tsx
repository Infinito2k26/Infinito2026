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
        <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
            <ErrorState onRetry={reset} />
        </div>
    )
}