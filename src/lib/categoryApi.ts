import { CategoryRequest, CategoryResponse } from "@/types/category";
import api from "./api";

export const categoryApi = {
    getAll: (): Promise<CategoryResponse[]> => api.get('/categories'),

    getById: (id: number): Promise<CategoryResponse> => api.get(`/categories/${id}`),

    create: (data: CategoryRequest): Promise<CategoryResponse> => api.post('/categories', data),

    updateById: (id: number, data: CategoryRequest): Promise<CategoryResponse> =>
        api.put(`/categories/${id}`, data),

    deleteById: (id: number): Promise<void> => api.delete(`/categories/${id}`),
};