export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    EVENT_MANAGER = 'EVENT_MANAGER',
    VOLUNTEER = 'VOLUNTEER',
    CAMPUS_AMBASSADOR = 'CAMPUS_AMBASSADOR',
    TEAM_CAPTAIN = 'TEAM_CAPTAIN',
    PARTICIPANT = 'PARTICIPANT'
}
  
export interface UserProfileResponse {
    id: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
    college?: string;
}