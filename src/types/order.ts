export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPING"
    | "DELIVERED"
    | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItemResponse {
    id: number;
    productName: string;
    variantId: number | null;
    variantInfo: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface OrderResponse {
    id: number;
    orderCode: string;
    receiverName: string;
    receiverPhone: string;
    shippingAddress: string;
    totalAmount: number;
    shippingFee: number;
    discountAmount: number;
    finalAmount: number;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    createdAt: string;
    updatedAt: string;
    items: OrderItemResponse[];
}

export interface OrderRequest {
    receiverName: string;
    receiverPhone: string;
    shippingAddress: string;
    paymentMethod: string;
}
