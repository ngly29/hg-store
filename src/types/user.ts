export type UserRole = "ADMIN" | "USER";

export interface UserResponse {
    id: number;
    email: string;
    phone?: string | null;
    fullName: string;
    role: UserRole;
    createdAt?: string | null;
}
