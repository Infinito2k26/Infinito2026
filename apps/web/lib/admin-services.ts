export const ADMIN_SERVICES = [
    "EVENTS",
    "REGISTRATIONS",
    "PAYMENTS",
    "MERCH",
    "TEAMS",
    "CONTENT",
    "GALLERY",
    "IDENTITY",
    "SETTINGS",
    "CA",
    "SPONSORS",
    "LEADS",
    "LEADERBOARD",
    "UPLOADS",
    "ADMIN_USERS",
] as const;

export type AdminServiceKey = (typeof ADMIN_SERVICES)[number];

// Matches the sidebar's page names, not the raw AdminService enum names —
// e.g. IDENTITY governs the "Gate Scans" admin page, CONTENT governs "Team".
export const ADMIN_SERVICE_LABELS: Record<AdminServiceKey, string> = {
    EVENTS: "Events",
    REGISTRATIONS: "Registrations",
    PAYMENTS: "Payments",
    MERCH: "Merch",
    TEAMS: "Teams",
    CONTENT: "Team (org page)",
    GALLERY: "Gallery",
    IDENTITY: "Gate Scans",
    SETTINGS: "Settings",
    CA: "CA Tasks & Applications",
    SPONSORS: "Sponsors",
    LEADS: "Leads",
    LEADERBOARD: "Leaderboard",
    UPLOADS: "Uploads",
    ADMIN_USERS: "Users",
};
