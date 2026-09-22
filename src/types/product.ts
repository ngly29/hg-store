export interface ProductImageResponse {
    id: number;
    productId: number | null;
    fileName: string | null;
    contentType: string | null;
    imageData: string | null;
    isPrimary: boolean | null;
}

export interface ProductResponse {
    id: number;
    name: string;
    slug?: string;
    description?: string | null;
    price: number;
    imgUrl?: string | null;
    isPublished?: boolean | null;
    categoryId?: number | null;
    categoryName?: string | null;
    images?: ProductImageResponse[] | null;
    variants?: VariantResponse[] | null;
}

export interface ProductRequest {
    name: string;
    description?: string | null;
    price: number;
    imgUrl?: string | null;
    isPublished?: boolean | null;
    categoryId: number;
    variants: VariantRequest[];
}

export interface VariantResponse {
    id: number;
    size: string;
    color: string;
    price: number;
    stock: number;
    sku: string;
    imgUrl?: string | null;
}

export interface VariantRequest {
    size: string;
    color: string;
    price?: number | null;
    stock?: number | null;
    sku: string;
    imgUrl?: string | null;
}