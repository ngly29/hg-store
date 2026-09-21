import { CategoryResponse } from "@/types/category";
import api from "./api";

export const categoryApi = {
    getAll: (): Promise<CategoryResponse[]> => api.get('/categories'),
}