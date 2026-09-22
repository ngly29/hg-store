import { ProductImageResponse, ProductRequest, ProductResponse } from "@/types/product";
import api from "./api";

export interface ProductQueryParams {
    page?: number;
    size?: number;
    categoryId?: number | null;
    search?: string | null;
    sort?: string;
}

export const productApi = {
    getAll: (params: ProductQueryParams = {}): Promise<ProductResponse[]> =>
        api.get('/products', { params }),

    getById: (id: number): Promise<ProductResponse> => api.get(`/products/${id}`),

    postProduct: (data: ProductRequest): Promise<ProductResponse> => api.post('/products', data),

    putProductById: (id: number, data: ProductRequest): Promise<ProductResponse> => api.put(`/products/${id}`, data),

    togglePublish: (id: number): Promise<ProductResponse> => api.put(`/products/${id}/publish`),

    deleteProductById: (id: number): Promise<void> => api.delete(`/products/${id}`),

    getProductImages: (productId: number): Promise<ProductImageResponse[]> =>
        api.get(`/products/${productId}/images`),

    uploadProductImage: (productId: number, file: File, isPrimary = false): Promise<ProductImageResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isPrimary', String(isPrimary));

        return api.post(`/products/${productId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    uploadProductImages: (productId: number, files: File[]): Promise<ProductImageResponse[]> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        return api.post(`/products/${productId}/images/multiple`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deleteProductImage: (productId: number, imageId: number): Promise<void> =>
        api.delete(`/products/${productId}/images/${imageId}`),

    setPrimaryImage: (productId: number, imageId: number): Promise<ProductImageResponse> =>
        api.put(`/products/${productId}/images/${imageId}/primary`),
}