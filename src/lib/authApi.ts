import api from "./api";
import { LoginRequest, LoginResponse, RegisterRequest, UserResponse } from "@/types/auth";

export const authApi = {
    login: (data: LoginRequest): Promise<LoginResponse> => 
        api.post<LoginResponse>("/auth/login", data) as unknown as Promise<LoginResponse>,
    register: (data: RegisterRequest): Promise<UserResponse> => 
        api.post<UserResponse>("/auth/register", data) as unknown as Promise<UserResponse>,
}