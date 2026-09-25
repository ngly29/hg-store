import { ProductResponse } from "@/types/product";

export function getProductImageUrl(product?: Partial<ProductResponse> | null): string {
    if (!product) return "/images/placeholder.svg";

    const primaryImage =
        product.images?.find((image) => image.isPrimary) ?? product.images?.[0];

    const candidate = primaryImage?.imageData || product.imgUrl || "";

    if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
    }

    return "/images/placeholder.svg";
}
