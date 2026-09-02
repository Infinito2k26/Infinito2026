import Link from "next/link";
import styles from "./admin-index.module.css";

const SECTIONS = [
    { title: "Users", href: "/admin/users", description: "Search any user, change their role, or ban/unban their account." },
    { title: "Roles", href: "/admin/roles", description: "Create scoped roles with per-service read/write/delete access." },
    { title: "Registrations", href: "/admin/registrations", description: "Every registration across all events, with live payment status." },
    { title: "Payments", href: "/admin/payments", description: "Review UPI screenshot + transaction ID submissions." },
    { title: "Events", href: "/admin/events", description: "Create, edit, and publish events." },
    { title: "Teams", href: "/admin/teams", description: "Browse all registered teams and rosters." },
    { title: "Gate Scans", href: "/admin/scans", description: "Most recent QR credential scans across all gates." },
    { title: "CA Applications", href: "/admin/ca-applications", description: "Review pending Campus Ambassador applications." },
    { title: "CA Tasks", href: "/admin/ca-tasks", description: "Manage tasks and brands for the CA program." },
    { title: "Team", href: "/admin/content/team", description: "Edit the organizing team roster shown on the public site." },
    { title: "Sponsors", href: "/admin/content/sponsors", description: "Manage sponsor logos and tiers." },
    { title: "Gallery", href: "/admin/content/gallery", description: "Upload and caption photos for the public gallery." },
    { title: "Merch Products", href: "/admin/merch/products", description: "Manage merch catalogue and publish status." },
    { title: "Merch Orders", href: "/admin/merch/orders", description: "Fulfil and track merch orders." },
    { title: "Settings", href: "/admin/settings", description: "Payment QR/VPA and fest dates — no deploy needed." },
];

export default function AdminIndexPage() {
    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Admin</h1>
                <p className={styles.subtitle}>Pick a section to manage.</p>
            </div>

            <div className={styles.grid}>
                {SECTIONS.map((section) => (
                    <Link key={section.href} href={section.href} className={styles.card}>
                        <h2 className={styles.cardTitle}>{section.title}</h2>
                        <p className={styles.cardDescription}>{section.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
