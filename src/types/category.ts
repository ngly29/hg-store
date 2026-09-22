export interface CategoryResponse {
    id: number;
    name: string;
    slug?: string | null;
    createdAt?: string | null;
}

export interface CategoryRequest {
    name: string;
}

export interface CategoryFormValues {
    name: string;
}