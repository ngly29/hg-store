import type { CartItemRequest, CartResponse } from "@/types/cart";
import api from "./api";

export const cartApi = {
    addToCart: (data: CartItemRequest): Promise<CartResponse> => api.post("/carts", data),

    getCart: (): Promise<CartResponse> => api.get("/carts"),

    updateItem: (itemId: number, quantity: number): Promise<CartResponse> =>
      api.put(`/carts/items/${itemId}`, null, { params: { quantity } }),

    removeItem: (itemId: number): Promise<CartResponse> =>
      api.delete(`/carts/items/${itemId}`),
}