import { ProductRequest, ProductResponse } from "@/types/product";
import api from "./api";

export const productApi = {
    getAll: (): Promise<ProductResponse[]> => api.get('/products'),

    getById: (id: number): Promise<ProductResponse> => api.get(`/products/${id}`),

    postProduct: (data: ProductRequest): Promise<ProductResponse> => api.post('/products', data),

    putProductById: (id:number, data: ProductRequest): Promise<ProductResponse> => api.put(`/products/${id}`, data),

    deleteProductById: (id: number): Promise<void> => api.delete(`/products/${id}`),
}