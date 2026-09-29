"use client";

import Link from "next/link";
import styles from "./Header.module.css";
import { Menu, Search, ShoppingBag, X, Minus, Plus, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/cartApi";
import { useNotification } from "@/stores/notificationStore";
import {
    calculateCartTotal,
    createEmptyCart,
    getCartImageUrl,
    readGuestCart,
    removeGuestCartItem,
    saveGuestCart,
    updateGuestCartItem,
} from "@/lib/guestCart";
import type { CartItemResponse } from "@/types/cart";

const menuItems = [
    { href: '/', label: 'HOME'},
    { href: '/abouts', label: 'ABOUT' },
    { href: '/categories', label: 'CATEGORIES' },
]
export default function HeaderUser() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [openSearch, setOpenSearch] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [openCart, setOpenCart] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);
    const addNotification = useNotification((state) => state.addNotification);
    const guestCartMergeInProgress = useRef(false);
    const {
        data: accountCart,
        isLoading: isCartLoading,
    } = useQuery({
        queryKey: ["cart"],
        queryFn: cartApi.getCart,
        enabled: isAuthenticated && hasHydrated,
    });
    const {
        data: guestCart,
        isLoading: isGuestCartLoading,
        isError: isGuestCartError,
    } = useQuery({
        queryKey: ["guest-cart"],
        queryFn: readGuestCart,
        enabled: !isAuthenticated && hasHydrated,
        staleTime: Infinity,
    });
    const cart = isAuthenticated ? accountCart : guestCart;
    const isLoadingCart =
        !hasHydrated || (isAuthenticated ? isCartLoading : isGuestCartLoading);

    useEffect(() => {
        if (!isGuestCartError) {
            return;
        }

        addNotification("error", "Không thể đọc giỏ hàng trên trình duyệt.");
    }, [addNotification, isGuestCartError]);

    useEffect(() => {
        if (!isAuthenticated || !hasHydrated || guestCartMergeInProgress.current) {
            return;
        }

        let pendingItems: CartItemResponse[];
        try {
            pendingItems = readGuestCart().items;
        } catch {
            addNotification("error", "Không thể đồng bộ giỏ hàng khách.");
            return;
        }

        if (pendingItems.length === 0) {
            return;
        }

        guestCartMergeInProgress.current = true;
        void (async () => {
            try {
                for (const item of pendingItems) {
                    await cartApi.addToCart({
                        variantId: item.variantId,
                        quantity: item.quantity,
                    });
                    const remainingItems = readGuestCart().items.filter(
                        (guestItem) => guestItem.variantId !== item.variantId
                    );
                    const updatedGuestCart = saveGuestCart({
                        ...createEmptyCart(),
                        items: remainingItems,
                    });
                    queryClient.setQueryData(["guest-cart"], updatedGuestCart);
                }

                await queryClient.invalidateQueries({ queryKey: ["cart"] });
                addNotification("success", "Giỏ hàng khách đã được đồng bộ.");
            } catch {
                addNotification(
                    "error",
                    "Không thể đồng bộ toàn bộ giỏ hàng. Các sản phẩm chưa đồng bộ vẫn được lưu."
                );
            } finally {
                guestCartMergeInProgress.current = false;
            }
        })();
    }, [addNotification, hasHydrated, isAuthenticated, queryClient]);

    const updateCartMutation = useMutation({
        mutationFn: ({
            itemId,
            quantity,
        }: {
            itemId: number;
            quantity: number;
        }) => cartApi.updateItem(itemId, quantity),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["cart"],
            });
        },
        onError: () => {
            addNotification("error", "Không thể cập nhật số lượng sản phẩm.");
        },
    });

    const removeCartMutation = useMutation({
        mutationFn: (itemId: number) =>
            cartApi.removeItem(itemId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["cart"],
            });
        },
        onError: () => {
            addNotification("error", "Không thể xóa sản phẩm khỏi giỏ hàng.");
        },
    });

    const changeItemQuantity = (itemId: number, quantity: number) => {
        if (isAuthenticated) {
            updateCartMutation.mutate({ itemId, quantity });
            return;
        }

        try {
            const updatedCart = updateGuestCartItem(readGuestCart(), itemId, quantity);
            queryClient.setQueryData(["guest-cart"], updatedCart);
        } catch {
            addNotification("error", "Không thể cập nhật giỏ hàng.");
        }
    };

    const removeItem = (itemId: number) => {
        if (isAuthenticated) {
            removeCartMutation.mutate(itemId);
            return;
        }

        try {
            const updatedCart = removeGuestCartItem(readGuestCart(), itemId);
            queryClient.setQueryData(["guest-cart"], updatedCart);
        } catch {
            addNotification("error", "Không thể xóa sản phẩm khỏi giỏ hàng.");
        }
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = searchValue.trim();
        if (!query) {
            return;
        }

        router.push(`/products?search=${encodeURIComponent(query)}`);
        window.dispatchEvent(new CustomEvent("product-search", { detail: query }));
        setOpenSearch(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <div className={styles.brand}>
                        <Link href="/"><Image alt="logo" src="https://hugan.vn/wp-content/uploads/2026/09/logo-toi-uu-website-1400x788.png.webp" 
                        width={100} height={50} /></Link>
                    </div>
                    <div className={styles.menu}>
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                                    <p>{item.label}</p>
                                </Link>
                            )
                        })}
                    </div>
                    <div className={styles.action}>
                        <div className={styles.search}>
                            <button type="button" onClick={() => setOpenSearch((prev) => !prev)} aria-label="Tìm kiếm">
                                <Search/>
                            </button>
                        </div>
                        <div className={styles.cartWrapper}>
                            <button
                                type="button"
                                className={styles.cart}
                                onClick={() => setOpenCart((prev) => !prev)}
                                aria-label="Giỏ hàng"
                            >
                                <ShoppingBag />

                                {cart && cart.items.length > 0 && (
                                    <span className={styles.cartBadge}>
                                        {cart.items.reduce((count, item) => count + item.quantity, 0)}
                                    </span>
                                )}
                            </button>

                            {openCart && (
                                <div className={styles.cartPopup}>

                                    <div className={styles.cartHeader}>
                                        <h3>Giỏ hàng</h3>

                                        <button
                                            type="button"
                                            onClick={() => setOpenCart(false)}
                                        >
                                            <X />
                                        </button>
                                    </div>

                                    <div className={styles.cartContent}>

                                        {isLoadingCart ? (

                                            <div className={styles.cartLoading}>
                                                Đang tải giỏ hàng...
                                            </div>

                                        ) : !cart || cart.items.length === 0 ? (

                                            <div className={styles.emptyCart}>
                                                <ShoppingBag />

                                                <p>
                                                    Giỏ hàng của bạn đang trống.
                                                </p>
                                            </div>

                                        ) : (

                                            <>
                                                <div className={styles.cartItems}>

                                                    {cart.items.map((item) => (

                                                        <div
                                                            key={item.id}
                                                            className={styles.cartItem}
                                                        >

                                                            {/* Ảnh */}
                                                            <div className={styles.cartItemImage}>
                                                                {getCartImageUrl(item.imgUrl) ? (
                                                                    <img
                                                                        src={getCartImageUrl(item.imgUrl) ?? ""}
                                                                        alt={item.productName}
                                                                    />
                                                                ) : (
                                                                    <div>
                                                                        No image
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Thông tin */}
                                                            <div className={styles.cartItemInfo}>

                                                                <p className={styles.cartItemName}>
                                                                    {item.productName}
                                                                </p>

                                                                <span className={styles.cartItemVariant}>
                                                                    {item.color &&
                                                                        `Màu: ${item.color}`}
                                                                    {item.size &&
                                                                        ` / Size: ${item.size}`}
                                                                </span>

                                                                <span className={styles.cartItemPrice}>
                                                                    {item.price.toLocaleString("vi-VN")} đ
                                                                </span>

                                                                {/* Số lượng */}
                                                                <div className={styles.cartItemBottom}>

                                                                    <div className={styles.quantityControl}>

                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                (isAuthenticated && item.id < 0) ||
                                                                                item.quantity <= 1
                                                                            }
                                                                            onClick={() =>
                                                                                changeItemQuantity(item.id, item.quantity - 1)
                                                                            }
                                                                        >
                                                                            <Minus />
                                                                        </button>

                                                                        <span>
                                                                            {item.quantity}
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                (isAuthenticated && item.id < 0) ||
                                                                                item.quantity >= item.stock
                                                                            }
                                                                            onClick={() =>
                                                                                changeItemQuantity(item.id, item.quantity + 1)
                                                                            }
                                                                        >
                                                                            <Plus />
                                                                        </button>

                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        className={styles.removeItem}
                                                                        disabled={isAuthenticated && item.id < 0}
                                                                        onClick={() => removeItem(item.id)}
                                                                    >
                                                                        <Trash2 />
                                                                    </button>

                                                                </div>

                                                            </div>

                                                        </div>
                                                    ))}

                                                </div>

                                                {/* Tổng tiền */}
                                                <div className={styles.cartFooter}>

                                                    <div className={styles.cartTotal}>
                                                        <span>Tổng cộng</span>

                                                        <strong>
                                                            {calculateCartTotal(cart.items).toLocaleString("vi-VN")} đ
                                                        </strong>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className={styles.checkoutButton}
                                                        onClick={() =>
                                                            router.push(
                                                                isAuthenticated
                                                                    ? "/checkout"
                                                                    : "/login?redirect=%2Fcheckout"
                                                            )
                                                        }
                                                    >
                                                        Thanh toán
                                                    </button>

                                                </div>
                                            </>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* <div className={styles.logout}><LogOut onClick={handleLogout}/></div> */}

                        {/*Hamburger */}
                        <button onClick={() => setOpen(!open)} className={styles.hamburger} aria-label="Menu">
                            {open ? <X/> : <Menu/>}
                        </button>
                    </div>
                </div>

                {open && (
                    <div className={styles.mobileMenu}>
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link href={item.href} key={item.href} className={`${styles.mobileNavItem} ${isActive ? styles.active : ""}`}
                                onClick={() => setOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Search */}
                {openSearch && (
                    <form className={styles.searchBox} onSubmit={handleSearch}>
                        <input type="text" placeholder="Tìm kiếm sản phẩm..."
                        value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
                        aria-label="Tìm kiếm sản phẩm"/>
                        <button type="submit" aria-label="Tìm kiếm"><Search/></button>
                    </form>
                )}
            </div>
        </div>
    )
}