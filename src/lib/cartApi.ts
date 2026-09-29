import { CartItemRequest, CartResponse } from "@/types/cart";
import api from "./api";

export const cartApi = {
    addToCart: (data: CartItemRequest) => api.post("/carts", data),

    getCart: (): Promise<CartResponse> => api.get("/carts"),

    updateItem: (itemId: number, quantity: number) => api.put(`/carts/items/${itemId}`, null, {
      params: { quantity },
    }),

    removeItem: (itemId: number) => api.delete(`/carts/items/${itemId}`),
}