import Link from "next/link";
import styles from "./admin-index.module.css";

const SECTIONS = [
    { title: "Registrations", href: "/admin/registrations", description: "Every registration across all events, with live payment status." },
    { title: "Payments", href: "/admin/payments", description: "Review UPI screenshot + transaction ID submissions." },
    { title: "Events", href: "/admin/events", description: "Create, edit, and publish events." },
    { title: "Teams", href: "/admin/teams", description: "Browse all registered teams and rosters." },
    { title: "Gate Scans", href: "/admin/scans", description: "Most recent QR credential scans across all gates." },
    { title: "CA Applications", href: "/admin/ca-applications", description: "Review pending Campus Ambassador applications." },
    { title: "CA Tasks", href: "/admin/ca-tasks", description: "Manage tasks and brands for the CA program." },
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
