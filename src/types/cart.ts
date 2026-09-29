export interface CartItemRequest {
    variantId: number;
    quantity: number;
}

export interface CartItemResponse {
    id: number;
    variantId: number;
    productName: string;
    size: string | null;
    color: string | null;
    imgUrl: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    stock: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  total: number;
}