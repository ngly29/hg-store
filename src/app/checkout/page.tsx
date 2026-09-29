"use client";

import {
    getAllProvincesSorted,
    getCommunesByProvinceId,
} from "vietnam-divisions-js/v3";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft, Check, Loader2, LockKeyhole, MapPin, PackageCheck, UserRound } from "lucide-react";
import { cartApi } from "@/lib/cartApi";
import { orderApi } from "@/lib/orderApi";
import { getCartImageUrl, calculateCartTotal } from "@/lib/guestCart";
import { useAuthStore } from "@/stores/authStore";
import { useNotification } from "@/stores/notificationStore";
import type { OrderResponse } from "@/types/order";
import styles from "./page.module.css";

type Province = Awaited<ReturnType<typeof getAllProvincesSorted>>[number];
type Commune = Awaited<ReturnType<typeof getCommunesByProvinceId>>[number];

const shippingMethods = [
    {
        id: "STANDARD",
        name: "Giao hàng tiêu chuẩn",
        description: "Phí giao hàng cố định",
        fee: 30_000,
        enabled: true,
    },
    {
        id: "EXPRESS",
        name: "Giao hàng nhanh",
        description: "Sắp hỗ trợ",
        fee: null,
        enabled: false,
    },
] as const;

const paymentMethods = [
    {
        id: "COD",
        name: "Thanh toán khi nhận hàng (COD)",
        description: "Thanh toán trực tiếp cho nhân viên giao hàng",
        enabled: true,
    },
    {
        id: "BANK_TRANSFER",
        name: "Chuyển khoản ngân hàng",
        description: "Sắp hỗ trợ",
        enabled: false,
    },
    {
        id: "ONLINE_PAYMENT",
        name: "Thanh toán trực tuyến",
        description: "Sắp hỗ trợ",
        enabled: false,
    },
] as const;

const formatPrice = (amount: number) =>
    `${amount.toLocaleString("vi-VN")}₫`;

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AxiosError) {
        const responseData: unknown = error.response?.data;
        if (typeof responseData === "string" && responseData.trim()) {
            return responseData;
        }
        if (
            responseData &&
            typeof responseData === "object" &&
            "message" in responseData &&
            typeof responseData.message === "string"
        ) {
            return responseData.message;
        }
    }

    return error instanceof Error ? error.message : fallback;
}

export default function CheckoutPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const addNotification = useNotification((state) => state.addNotification);
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);
    const logout = useAuthStore((state) => state.logout);

    const [receiverName, setReceiverName] = useState<string | null>(null);
    const [receiverPhone, setReceiverPhone] = useState<string | null>(null);
    const [addressDetail, setAddressDetail] = useState("");
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [communes, setCommunes] = useState<Commune[]>([]);
    const [provinceId, setProvinceId] = useState("");
    const [communeId, setCommuneId] = useState("");
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [selectedShipping, setSelectedShipping] = useState<string>("STANDARD");
    const [selectedPayment, setSelectedPayment] = useState<string>("COD");
    const [submitting, setSubmitting] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<OrderResponse | null>(null);

    const cartQuery = useQuery({
        queryKey: ["cart"],
        queryFn: cartApi.getCart,
        enabled: hasHydrated && isAuthenticated && user?.role === "USER",
    });

    useEffect(() => {
        if (hasHydrated && !isAuthenticated) {
            router.replace("/login?redirect=%2Fcheckout");
        }
    }, [hasHydrated, isAuthenticated, router]);

    useEffect(() => {
        let isCurrent = true;

        const loadProvinces = async () => {
            try {
                const result = await getAllProvincesSorted();
                if (isCurrent) {
                    setProvinces(result);
                    setLocationError(null);
                }
            } catch (error) {
                if (isCurrent) {
                    setLocationError(
                        getErrorMessage(error, "Không thể tải dữ liệu địa chỉ.")
                    );
                }
            } finally {
                if (isCurrent) {
                    setLocationLoading(false);
                }
            }
        };

        void loadProvinces();
        return () => {
            isCurrent = false;
        };
    }, []);

    useEffect(() => {
        if (!provinceId) {
            return;
        }

        let isCurrent = true;

        const loadCommunes = async () => {
            try {
                const result = await getCommunesByProvinceId(provinceId);
                if (isCurrent) {
                    setCommunes(result);
                }
            } catch (error) {
                if (isCurrent) {
                    setLocationError(
                        getErrorMessage(error, "Không thể tải danh sách phường, xã.")
                    );
                }
            } finally {
                if (isCurrent) {
                    setLocationLoading(false);
                }
            }
        };

        void loadCommunes();
        return () => {
            isCurrent = false;
        };
    }, [provinceId]);

    const selectedProvince = provinces.find((province) => province.idProvince === provinceId);
    const selectedCommune = communes.find((commune) => commune.idCommune === communeId);
    const receiverNameValue = receiverName ?? user?.fullName ?? "";
    const receiverPhoneValue = receiverPhone ?? user?.phone ?? "";
    const subtotal = useMemo(
        () => calculateCartTotal(cartQuery.data?.items ?? []),
        [cartQuery.data?.items]
    );
    const shippingFee =
        shippingMethods.find((method) => method.id === selectedShipping)?.fee ?? 0;
    const total = subtotal + shippingFee;

    const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!cartQuery.data || cartQuery.data.items.length === 0) {
            addNotification("error", "Giỏ hàng đang trống.");
            return;
        }

        const normalizedPhone = receiverPhoneValue.trim();
        const phoneDigits = normalizedPhone.replace(/\D/g, "");
        if (phoneDigits.length < 9 || phoneDigits.length > 12) {
            addNotification("error", "Vui lòng nhập số điện thoại hợp lệ.");
            return;
        }

        if (receiverNameValue.trim().length < 2) {
            addNotification("error", "Vui lòng nhập họ và tên người nhận.");
            return;
        }

        if (!selectedProvince || !selectedCommune) {
            addNotification("error", "Vui lòng chọn tỉnh/thành và phường/xã.");
            return;
        }

        const shippingAddress = [
            addressDetail.trim(),
            selectedCommune.name,
            selectedProvince.name,
        ].join(", ");

        setSubmitting(true);
        try {
            const order = await orderApi.create({
                receiverName: receiverNameValue.trim(),
                receiverPhone: normalizedPhone,
                shippingAddress,
                paymentMethod: selectedPayment,
            });
            setCompletedOrder(order);
            queryClient.setQueryData(["cart"], {
                ...cartQuery.data,
                items: [],
                total: 0,
            });
            addNotification("success", "Đặt hàng thành công.");
        } catch (error) {
            addNotification(
                "error",
                getErrorMessage(error, "Không thể tạo đơn hàng. Vui lòng thử lại.")
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!hasHydrated || !isAuthenticated) {
        return (
            <div className={styles.centerMessage} role="status">
                <Loader2 className={styles.spinner} aria-hidden="true" />
                Đang kiểm tra tài khoản...
            </div>
        );
    }

    if (user?.role !== "USER") {
        return (
            <div className={styles.centerMessage}>
                <div className={styles.accessCard}>
                    <LockKeyhole size={28} aria-hidden="true" />
                    <h1>Checkout dành cho tài khoản khách hàng</h1>
                    <p>Vui lòng đăng xuất và đăng nhập bằng tài khoản người dùng để tiếp tục.</p>
                    <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => {
                            logout();
                            router.replace("/login?redirect=%2Fcheckout");
                        }}
                    >
                        Đăng xuất và đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    if (completedOrder) {
        return (
            <div className={styles.successPage}>
                <div className={styles.successCard}>
                    <span className={styles.successIcon}>
                        <Check size={30} aria-hidden="true" />
                    </span>
                    <p className={styles.eyebrow}>HUGAN STORE</p>
                    <h1>Cảm ơn bạn đã đặt hàng!</h1>
                    <p>
                        Mã đơn hàng của bạn: <strong>{completedOrder.orderCode}</strong>
                    </p>
                    <p>Chúng tôi sẽ liên hệ để xác nhận đơn hàng trong thời gian sớm nhất.</p>
                    <Link className={styles.primaryButton} href="/">
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    if (cartQuery.isLoading) {
        return (
            <div className={styles.centerMessage} role="status">
                <Loader2 className={styles.spinner} aria-hidden="true" />
                Đang tải giỏ hàng...
            </div>
        );
    }

    if (cartQuery.isError) {
        return (
            <div className={styles.centerMessage}>
                <div className={styles.accessCard}>
                    <h1>Không thể tải giỏ hàng</h1>
                    <p>{getErrorMessage(cartQuery.error, "Vui lòng thử lại.")}</p>
                    <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => void cartQuery.refetch()}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!cartQuery.data || cartQuery.data.items.length === 0) {
        return (
            <div className={styles.centerMessage}>
                <div className={styles.accessCard}>
                    <PackageCheck size={32} aria-hidden="true" />
                    <h1>Giỏ hàng đang trống</h1>
                    <p>Thêm sản phẩm vào giỏ trước khi tiến hành thanh toán.</p>
                    <Link className={styles.primaryButton} href="/products">
                        Quay lại mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <Link className={styles.brand} href="/" aria-label="Hugan Store - Trang chủ">
                    HUGAN
                </Link>
                <div className={styles.breadcrumb}>
                    <Link href="/">Trang chủ</Link>
                    <span>/</span>
                    <Link href="/products">Sản phẩm</Link>
                    <span>/</span>
                    <span>Thông tin giao hàng</span>
                </div>
            </header>

            <div className={styles.checkoutGrid}>
                <section className={styles.formColumn}>
                    <h1 className={styles.pageTitle}>Thông tin giao hàng</h1>
                    <div className={styles.accountLine}>
                        <UserRound size={18} aria-hidden="true" />
                        <span>{user.email}</span>
                        <span className={styles.accountNote}>Đang đăng nhập</span>
                    </div>

                    <form className={styles.form} onSubmit={handlePlaceOrder}>
                        <div className={styles.field}>
                            <label htmlFor="receiverName">Họ và tên người nhận</label>
                            <input
                                autoComplete="name"
                                id="receiverName"
                                maxLength={100}
                                onChange={(event) => setReceiverName(event.target.value)}
                                placeholder="Nhập họ và tên"
                                required
                                value={receiverNameValue}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="receiverEmail">Email tài khoản</label>
                            <input
                                autoComplete="email"
                                id="receiverEmail"
                                readOnly
                                value={user.email}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="receiverPhone">Số điện thoại</label>
                            <input
                                autoComplete="tel"
                                id="receiverPhone"
                                inputMode="tel"
                                maxLength={20}
                                onChange={(event) => setReceiverPhone(event.target.value)}
                                placeholder="Nhập số điện thoại nhận hàng"
                                required
                                value={receiverPhoneValue}
                            />
                        </div>

                        <fieldset className={styles.addressSection}>
                            <legend>Địa chỉ nhận hàng</legend>
                            <div className={styles.addressGrid}>
                                <div className={styles.field}>
                                    <label htmlFor="province">Tỉnh / Thành phố</label>
                                    <select
                                        disabled={locationLoading || provinces.length === 0}
                                        id="province"
                                        onChange={(event) => {
                                            const nextProvinceId = event.target.value;
                                            setProvinceId(nextProvinceId);
                                            setCommuneId("");
                                            setCommunes([]);
                                            setLocationError(null);
                                            setLocationLoading(Boolean(nextProvinceId));
                                        }}
                                        required
                                        value={provinceId}
                                    >
                                        <option value="">Chọn tỉnh / thành</option>
                                        {provinces.map((province) => (
                                            <option key={province.idProvince} value={province.idProvince}>
                                                {province.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="commune">Phường / Xã</label>
                                    <select
                                        disabled={!provinceId || locationLoading || communes.length === 0}
                                        id="commune"
                                        onChange={(event) => setCommuneId(event.target.value)}
                                        required
                                        value={communeId}
                                    >
                                        <option value="">Chọn phường / xã</option>
                                        {communes.map((commune) => (
                                            <option key={commune.idCommune} value={commune.idCommune}>
                                                {commune.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="addressDetail">Địa chỉ cụ thể</label>
                                <textarea
                                    autoComplete="street-address"
                                    id="addressDetail"
                                    maxLength={500}
                                    onChange={(event) => setAddressDetail(event.target.value)}
                                    placeholder="Số nhà, tên đường, tòa nhà..."
                                    required
                                    rows={2}
                                    value={addressDetail}
                                />
                            </div>
        
                            {locationLoading && (
                                <p className={styles.inlineStatus} role="status">
                                    <Loader2 className={styles.spinner} size={15} aria-hidden="true" />
                                    Đang tải dữ liệu địa chỉ...
                                </p>
                            )}
                            {locationError && (
                                <p className={styles.inlineError} role="alert">{locationError}</p>
                            )}
                        </fieldset>

                        <section className={styles.optionSection} aria-labelledby="shipping-heading">
                            <h2 id="shipping-heading">Phương thức vận chuyển</h2>
                            <div className={styles.optionList}>
                                {shippingMethods.map((method) => (
                                    <label
                                        className={`${styles.optionCard} ${!method.enabled ? styles.optionDisabled : ""}`}
                                        key={method.id}
                                    >
                                        <input
                                            checked={selectedShipping === method.id}
                                            disabled={!method.enabled}
                                            name="shippingMethod"
                                            onChange={() => setSelectedShipping(method.id)}
                                            type="radio"
                                        />
                                        <span className={styles.optionCopy}>
                                            <strong>{method.name}</strong>
                                            <small>{method.description}</small>
                                        </span>
                                        <span className={styles.optionPrice}>
                                            {method.fee === null ? "—" : formatPrice(method.fee)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section className={styles.optionSection} aria-labelledby="payment-heading">
                            <h2 id="payment-heading">Phương thức thanh toán</h2>
                            <div className={styles.optionList}>
                                {paymentMethods.map((method) => (
                                    <label
                                        className={`${styles.optionCard} ${!method.enabled ? styles.optionDisabled : ""}`}
                                        key={method.id}
                                    >
                                        <input
                                            checked={selectedPayment === method.id}
                                            disabled={!method.enabled}
                                            name="paymentMethod"
                                            onChange={() => setSelectedPayment(method.id)}
                                            type="radio"
                                        />
                                        <span className={styles.optionCopy}>
                                            <strong>{method.name}</strong>
                                            <small>{method.description}</small>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        <div className={styles.formFooter}>
                            <Link className={styles.backLink} href="/">
                                <ArrowLeft size={16} aria-hidden="true" />
                                Tiếp tục mua sắm
                            </Link>
                            <button
                                className={styles.submitButton}
                                disabled={
                                    submitting ||
                                    locationLoading ||
                                    !selectedProvince ||
                                    !selectedCommune ||
                                    !selectedShipping ||
                                    !selectedPayment
                                }
                                type="submit"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className={styles.spinner} size={17} aria-hidden="true" />
                                        Đang đặt hàng...
                                    </>
                                ) : "Hoàn tất đơn hàng"}
                            </button>
                        </div>
                    </form>
                </section>

                <aside className={styles.summaryColumn} aria-label="Thông tin đơn hàng">
                    <h2 className={styles.summaryTitle}>Đơn hàng của bạn</h2>
                    <div className={styles.productList}>
                        {cartQuery.data.items.map((item) => (
                            <div className={styles.productRow} key={item.id}>
                                <div className={styles.productImage}>
                                    {getCartImageUrl(item.imgUrl) ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            alt={item.productName}
                                            src={getCartImageUrl(item.imgUrl) ?? ""}
                                        />
                                    ) : (
                                        <PackageCheck size={22} aria-hidden="true" />
                                    )}
                                    <span className={styles.quantityBadge}>{item.quantity}</span>
                                </div>
                                <div className={styles.productInfo}>
                                    <strong>{item.productName}</strong>
                                    <span>
                                        {[item.color, item.size].filter(Boolean).join(" / ") || "Sản phẩm"}
                                    </span>
                                </div>
                                <strong className={styles.productPrice}>
                                    {formatPrice(Number(item.price) * item.quantity)}
                                </strong>
                            </div>
                        ))}
                    </div>

                    <div className={styles.summaryLines}>
                        <div>
                            <span>Tạm tính</span>
                            <strong>{formatPrice(subtotal)}</strong>
                        </div>
                        <div>
                            <span>Phí vận chuyển</span>
                            <strong>{formatPrice(shippingFee)}</strong>
                        </div>
                    </div>
                    {selectedProvince && selectedCommune && (
                        <div className={styles.deliveryPreview}>
                            <MapPin size={16} aria-hidden="true" />
                            <span>{selectedCommune.name}, {selectedProvince.name}</span>
                        </div>
                    )}
                    <div className={styles.grandTotal}>
                        <span>Tổng cộng</span>
                        <strong>{formatPrice(total)}</strong>
                    </div>
        
                </aside>
            </div>
        </main>
    );
}
