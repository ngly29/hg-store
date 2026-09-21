export interface ProductResponse{
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    imgUrl: string;
    isPublished?: boolean;
    categoryId: number;
    categoryName: string;
    variants: VariantResponse[];
}

export interface ProductRequest{
    name: string;
    description: string;
    price: number;
    imgUrl: string;
    isPublished?: boolean;
    categoryId: number;
    variants: VariantRequest[];
}

export interface VariantResponse{
    id: number;
    size: string;
    color: string;
    price: number;
    stock: number;
    sku: string;
    imgUrl: string;
}

export interface VariantRequest{
    size: string;
    color: string;
    stock: number;
    sku: string;
    imgUrl: string;
    price:number
}