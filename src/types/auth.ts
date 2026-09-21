export interface UserResponse{
    userId: number;
    phone: string;
    email: string;
    fullName:string;
    role: "USER" | "ADMIN";
}

export interface LoginRequest{
    email: string;
    password: string;
}

export interface LoginResponse{
    userId: number;
    email: string;
    phone: string,
    fullName: string;
    role: string;
    token: string;
    message: string;
}

export interface RegisterRequest{
    email: string;
    phone?:string;
    fullName:string;
    password:string;
}