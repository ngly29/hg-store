import api from "./api";
import { UserResponse } from "@/types/user";

export const userApi = {
    getAll: (): Promise<UserResponse[]> => api.get("/users"),
};
