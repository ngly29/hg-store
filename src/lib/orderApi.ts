import api from "./api";
import { OrderRequest, OrderResponse, OrderStatus } from "@/types/order";

export const orderApi = {
    create: (data: OrderRequest): Promise<OrderResponse> => api.post("/orders", data),

    getMyOrders: (): Promise<OrderResponse[]> => api.get("/orders"),

    getById: (orderId: number): Promise<OrderResponse> => api.get(`/orders/${orderId}`),

    cancelOrder: (orderId: number): Promise<OrderResponse> => api.put(`/orders/${orderId}/cancel`),

    adminGetAll: (): Promise<OrderResponse[]> => api.get("/orders/admin/all"),

    adminUpdateStatus: (orderId: number, status: OrderStatus): Promise<OrderResponse> =>
        api.put(`/orders/admin/${orderId}/status`, null, {
            params: { status },
        }),
};
