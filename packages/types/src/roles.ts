export enum AdminService {
    EVENTS = 'EVENTS',
    REGISTRATIONS = 'REGISTRATIONS',
    PAYMENTS = 'PAYMENTS',
    MERCH = 'MERCH',
    TEAMS = 'TEAMS',
    CONTENT = 'CONTENT',
    GALLERY = 'GALLERY',
    IDENTITY = 'IDENTITY',
    SETTINGS = 'SETTINGS',
    CA = 'CA',
    SPONSORS = 'SPONSORS',
    LEADS = 'LEADS',
    LEADERBOARD = 'LEADERBOARD',
    UPLOADS = 'UPLOADS',
    ADMIN_USERS = 'ADMIN_USERS'
}

export interface RolePermission {
    id: string;
    service: AdminService;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
}

export interface CustomRole {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    permissions: RolePermission[];
    _count?: { users: number };
}
