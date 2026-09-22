"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Package,
    ShoppingCart,
    Tags,
    TrendingUp,
    UserRound,
    Wallet,
} from "lucide-react";

import { categoryApi } from "@/lib/categoryApi";
import { orderApi } from "@/lib/orderApi";
import { productApi } from "@/lib/productApi";
import { userApi } from "@/lib/userApi";

import { CategoryResponse } from "@/types/category";
import { OrderResponse } from "@/types/order";
import { ProductResponse } from "@/types/product";
import { UserResponse } from "@/types/user";

import styles from "./page.module.css";

const chartColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#a78bfa",
    "#f97316",
    "#ec4899",
];

const formatCurrency = (value: number) =>
    `${Math.round(value).toLocaleString("vi-VN")} ₫`;

export default function AdminPage() {
    const {
        data: dashboardData = [[], [], [], []] as [
            ProductResponse[],
            CategoryResponse[],
            UserResponse[],
            OrderResponse[]
        ],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const [products, categories, users, orders] = await Promise.all([
                productApi.getAll(),
                categoryApi.getAll(),
                userApi.getAll(),
                orderApi.adminGetAll(),
            ]);

            return [
                products,
                categories,
                users,
                orders,
            ] as [
                ProductResponse[],
                CategoryResponse[],
                UserResponse[],
                OrderResponse[]
            ];
        },
    });

    const [products, categories, users, orders] = dashboardData;

    /*
     * =========================
     * SUMMARY
     * =========================
     */

    const summary = {
        totalRevenue: orders.reduce(
            (sum, order) => sum + Number(order.finalAmount || 0),
            0
        ),

        totalOrders: orders.length,

        totalProducts: products.length,

        totalCategories: categories.length,

        totalUsers: users.length,

        pendingOrders: orders.filter(
            (order) => order.orderStatus === "PENDING"
        ).length,

        activeProducts: products.filter(
            (product) => Boolean(product.isPublished)
        ).length,
    };

    /*
     * =========================
     * MONTHLY REVENUE
     * =========================
     */

    const monthlyRevenue = useMemo(() => {
        const now = new Date();

        return Array.from({ length: 6 }, (_, index) => {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - (5 - index),
                1
            );

            const monthLabel = date.toLocaleDateString("vi-VN", {
                month: "short",
            });

            const value = orders.reduce((sum, order) => {
                if (!order.createdAt) {
                    return sum;
                }

                const createdAt = new Date(order.createdAt);

                const isSameMonth =
                    createdAt.getFullYear() === date.getFullYear() &&
                    createdAt.getMonth() === date.getMonth();

                if (!isSameMonth) {
                    return sum;
                }

                return sum + Number(order.finalAmount || 0);
            }, 0);

            return {
                label: monthLabel,
                value,
            };
        });
    }, [orders]);

    const maxRevenue = Math.max(
        ...monthlyRevenue.map((item) => item.value),
        1
    );

    /*
     * =========================
     * ORDER STATUS
     * =========================
     */

    const orderStatusData = useMemo(() => {
        const statusMap = {
            PENDING: 0,
            CONFIRMED: 0,
            SHIPPING: 0,
            DELIVERED: 0,
            CANCELLED: 0,
        };

        orders.forEach((order) => {
            const status =
                order.orderStatus as keyof typeof statusMap;

            if (statusMap[status] !== undefined) {
                statusMap[status] += 1;
            }
        });

        return [
            {
                label: "Chờ xác nhận",
                value: statusMap.PENDING,
                color: "#f59e0b",
            },
            {
                label: "Đã xác nhận",
                value: statusMap.CONFIRMED,
                color: "#3b82f6",
            },
            {
                label: "Đang giao",
                value: statusMap.SHIPPING,
                color: "#38bdf8",
            },
            {
                label: "Đã giao",
                value: statusMap.DELIVERED,
                color: "#10b981",
            },
            {
                label: "Đã hủy",
                value: statusMap.CANCELLED,
                color: "#ef4444",
            },
        ];
    }, [orders]);

    /*
     * =========================
     * STAT CARDS
     * =========================
     */

    const statsCards = [
        {
            title: "Tổng doanh thu",
            value: formatCurrency(summary.totalRevenue),
            icon: <Wallet size={20} />,
            tone: styles.cardBlue,
        },
        {
            title: "Tổng đơn hàng",
            value: summary.totalOrders.toString(),
            icon: <ShoppingCart size={20} />,
            tone: styles.cardGreen,
        },
        {
            title: "Sản phẩm đang bán",
            value: `${summary.activeProducts}/${summary.totalProducts}`,
            icon: <Package size={20} />,
            tone: styles.cardOrange,
        },
        {
            title: "Khách hàng",
            value: summary.totalUsers.toString(),
            icon: <UserRound size={20} />,
            tone: styles.cardPurple,
        },
        {
            title: "Danh mục",
            value: summary.totalCategories.toString(),
            icon: <Tags size={20} />,
            tone: styles.cardTeal,
        },
        {
            title: "Đơn chờ xác nhận",
            value: summary.pendingOrders.toString(),
            icon: <TrendingUp size={20} />,
            tone: styles.cardRose,
        },
    ];

    /*
     * =========================
     * LOADING
     * =========================
     */

    if (isLoading) {
        return (
            <div className={styles.loading}>
                Đang tải thống kê...
            </div>
        );
    }

    /*
     * =========================
     * ERROR
     * =========================
     */

    if (isError) {
        return (
            <div className={styles.emptyState}>
                Không thể tải dữ liệu dashboard.
            </div>
        );
    }

    /*
     * =========================
     * UI
     * =========================
     */

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.headerRow}>
                <div>
                    <p className={styles.eyebrow}>
                        Tổng quan
                    </p>

                    <h1 className={styles.title}>
                        Dashboard
                    </h1>
                </div>
            </div>

            {/* Statistics */}
            <div className={styles.cardsGrid}>
                {statsCards.map((card) => (
                    <div
                        key={card.title}
                        className={`${styles.metricCard} ${card.tone}`}
                    >
                        <div className={styles.metricHead}>
                            <div className={styles.iconWrap}>
                                {card.icon}
                            </div>
                        </div>

                        <p className={styles.metricTitle}>
                            {card.title}
                        </p>

                        <h3 className={styles.metricValue}>
                            {card.value}
                        </h3>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className={styles.sectionGrid}>
                {/* Revenue */}
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h2>
                            Doanh thu 6 tháng gần nhất
                        </h2>
                    </div>

                    <div className={styles.chartWrap}>
                        <div className={styles.chartBars}>
                            {monthlyRevenue.map((item, index) => {
                                const height =
                                    (item.value / maxRevenue) * 100;

                                return (
                                    <div
                                        key={`${item.label}-${index}`}
                                        className={styles.barGroup}
                                    >
                                        <div className={styles.barValue}>
                                            {item.value
                                                ? formatCurrency(item.value)
                                                : "0 ₫"}
                                        </div>

                                        <div
                                            className={
                                                styles.barContainer
                                            }
                                        >
                                            <div
                                                className={styles.bar}
                                                style={{
                                                    height: `${Math.max(
                                                        height,
                                                        item.value > 0
                                                            ? 10
                                                            : 2
                                                    )}%`,

                                                    background:
                                                        `linear-gradient(180deg, ${
                                                            chartColors[
                                                                index %
                                                                    chartColors.length
                                                            ]
                                                        } 0%, #2563eb 100%)`,
                                                }}
                                            />
                                        </div>

                                        <span
                                            className={
                                                styles.barLabel
                                            }
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Order Status */}
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h2>
                            Trạng thái đơn hàng
                        </h2>
                    </div>

                    <div className={styles.statusList}>
                        {orderStatusData.map((item) => (
                            <div
                                key={item.label}
                                className={styles.statusItem}
                            >
                                <div
                                    className={
                                        styles.statusMeta
                                    }
                                >
                                    <span
                                        className={
                                            styles.statusDot
                                        }
                                        style={{
                                            backgroundColor:
                                                item.color,
                                        }}
                                    />

                                    <span>
                                        {item.label}
                                    </span>
                                </div>

                                <strong>
                                    {item.value}
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}