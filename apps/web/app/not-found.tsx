import { NotFound } from "@/components/ui/not-found";

export default function GlobalNotFound() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-primary)' }}>
            <NotFound
                title="Page not found"
                description="The page you're looking for doesn't exist or has been moved."
                backHref="/"
                backLabel="Back to Home"
            />
        </div>
    );
}
