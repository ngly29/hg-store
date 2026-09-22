"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { orderApi } from "@/lib/orderApi";
import { useNotification } from "@/stores/notificationStore";
import { OrderResponse, OrderStatus, PaymentStatus } from "@/types/order";
import styles from "./page.module.css";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "SHIPPING",
    "DELIVERED",
    "CANCELLED",
];

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    FAILED: "Thất bại",
    REFUNDED: "Hoàn tiền",
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
    CANCELLED: "Đã hủy",
};

const statusClassMap: Record<OrderStatus, string> = {
    PENDING: styles.statusPending,
    CONFIRMED: styles.statusConfirmed,
    SHIPPING: styles.statusShipping,
    DELIVERED: styles.statusDelivered,
    CANCELLED: styles.statusCancelled,
};

const paymentClassMap: Record<PaymentStatus, string> = {
    PENDING: styles.paymentPending,
    PAID: styles.paymentPaid,
    FAILED: styles.paymentFailed,
    REFUNDED: styles.paymentRefunded,
};

export default function OrdersPage() {
    const { addNotification } = useNotification();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const {
        data: orders = [],
        isLoading,
        isError,
    } = useQuery<OrderResponse[]>({
        queryKey: ["orders-admin"],
        queryFn: orderApi.adminGetAll,
    });

    const filteredOrders = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) return orders;

        return orders.filter((order) => {
            const matchesCode = order.orderCode.toLowerCase().includes(keyword);
            const matchesCustomer = order.receiverName.toLowerCase().includes(keyword);
            const matchesPhone = order.receiverPhone.toLowerCase().includes(keyword);
            const matchesAddress = order.shippingAddress.toLowerCase().includes(keyword);

            return matchesCode || matchesCustomer || matchesPhone || matchesAddress;
        });
    }, [orders, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginatedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleStatusChange = async (orderId: number, status: OrderStatus) => {
        try {
            setUpdatingId(orderId);
            await orderApi.adminUpdateStatus(orderId, status);
            await queryClient.invalidateQueries({ queryKey: ["orders-admin"] });
            addNotification("success", "Cập nhật trạng thái thành công!");
        } catch (error: any) {
            addNotification(
                "error",
                error?.response?.data?.message ||
                    error?.message ||
                    "Cập nhật trạng thái đơn hàng thất bại!"
            );
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div>
                    <p className={styles.eyebrow}>Quản lý</p>
                    <h1 className={styles.title}>Đơn hàng</h1>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Tìm theo mã đơn, khách hàng, SĐT, địa chỉ"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className={styles.emptyState}>Đang tải đơn hàng...</div>
                ) : isError ? (
                    <div className={styles.emptyState}>Không thể tải dữ liệu đơn hàng.</div>
                ) : filteredOrders.length === 0 ? (
                    <div className={styles.emptyState}>Chưa có đơn hàng nào.</div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã đơn</th>
                                        <th>Khách hàng</th>
                                        <th>Địa chỉ</th>
                                        <th>Tổng tiền</th>
                                        <th>Thanh toán</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.map((order, index) => (
                                        <tr key={order.id}>
                                            <td>{(safePage - 1) * pageSize + index + 1}</td>
                                            <td className={styles.codeCell}>{order.orderCode}</td>
                                            <td>
                                                <div className={styles.customerCell}>
                                                    <strong>{order.receiverName}</strong>
                                                    <span>{order.receiverPhone}</span>
                                                </div>
                                            </td>
                                            <td className={styles.addressCell}>{order.shippingAddress}</td>
                                            <td>{Number(order.finalAmount || 0).toLocaleString("vi-VN")}₫</td>
                                            <td>
                                                <span className={`${styles.badge} ${paymentClassMap[order.paymentStatus]}`}>
                                                    {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${statusClassMap[order.orderStatus]}`}>
                                                    {ORDER_STATUS_LABEL[order.orderStatus]}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className={styles.statusSelect}
                                                    value={order.orderStatus}
                                                    onChange={(event) =>
                                                        handleStatusChange(
                                                            order.id,
                                                            event.target.value as OrderStatus
                                                        )
                                                    }
                                                    disabled={updatingId === order.id}
                                                >
                                                    {ORDER_STATUS_OPTIONS.map((status) => (
                                                        <option key={status} value={status}>
                                                            {ORDER_STATUS_LABEL[status]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.paginationBar}>
                            <div className={styles.paginationInfo}>
                                Hiển thị {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredOrders.length)} / {filteredOrders.length} đơn hàng
                            </div>

                            <div className={styles.paginationControls}>
                                <select
                                    className={styles.pageSizeSelect}
                                    value={pageSize}
                                    onChange={(event) => {
                                        setPageSize(Number(event.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value={5}>5 / trang</option>
                                    <option value={10}>10 / trang</option>
                                    <option value={20}>20 / trang</option>
                                </select>

                                <button
                                    type="button"
                                    className={styles.pageButton}
                                    disabled={safePage === 1}
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                >
                                    Trước
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`${styles.pageButton} ${item === safePage ? styles.pageButtonActive : ""}`}
                                        onClick={() => setPage(item)}
                                    >
                                        {item}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className={styles.pageButton}
                                    disabled={safePage === totalPages}
                                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
