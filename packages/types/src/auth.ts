export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    VOLUNTEER = 'VOLUNTEER',
    CAMPUS_AMBASSADOR = 'CAMPUS_AMBASSADOR',
    PARTICIPANT = 'PARTICIPANT'
}
  
export interface UserProfileResponse {
    id: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
    college?: string;
    customRole?: {
        id: string;
        name: string;
        permissions: {
            service: string;
            canRead: boolean;
            canWrite: boolean;
            canDelete: boolean;
        }[];
    } | null;
}