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
import { productApi } from "@/lib/productApi";
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
import type { CartItemResponse, CartResponse } from "@/types/cart";
import type { ProductResponse } from "@/types/product";

interface PendingQuantityUpdate {
    originalQuantity: number;
    latestQuantity: number;
    timer: ReturnType<typeof setTimeout> | null;
    isSaving: boolean;
}

function CartItemThumbnail({ item }: { item: CartItemResponse }) {
    const hasVariantImage = Boolean(getCartImageUrl(item.imgUrl));
    const { data: product, isLoading: isLoadingProduct } = useQuery<ProductResponse | null>({
        queryKey: ["cart-product-image", item.productName],
        queryFn: async () => {
            const matches = await productApi.getAll({
                search: item.productName,
                size: 1,
            });
            return matches.find((candidate) => candidate.name === item.productName) ?? null;
        },
        enabled: !hasVariantImage,
        staleTime: 5 * 60 * 1000,
    });

    const variantImage = product?.variants?.find(
        (variant) => variant.id === item.variantId
    )?.imgUrl;
    const productImage =
        product?.images?.find((image) => image.isPrimary) ?? product?.images?.[0];
    const imageUrl =
        getCartImageUrl(item.imgUrl) ??
        getCartImageUrl(variantImage ?? null) ??
        getCartImageUrl(productImage?.imageData ?? null) ??
        getCartImageUrl(product?.imgUrl ?? null);

    const [failedImage, setFailedImage] = useState<string | null>(null);

    return imageUrl && failedImage !== imageUrl ? (
        <img
            src={imageUrl}
            alt={item.productName}
            onError={() => setFailedImage(imageUrl)}
        />
    ) : (
        <div className={styles.cartImagePlaceholder} aria-label="Ảnh sản phẩm chưa có">
            {isLoadingProduct ? "Đang tải ảnh..." : "Không có ảnh"}
        </div>
    );
}

const menuItems = [
    { href: '/', label: 'HOME'},
    { href: '/abouts', label: 'ABOUT' },
    { href: '/categories', label: 'CATEGORIES' },
    { href: '/intros', label: 'INTRODUCE' },
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
    const pendingQuantityUpdates = useRef(new Map<number, PendingQuantityUpdate>());
    const [pendingQuantityItemIds, setPendingQuantityItemIds] = useState<Set<number>>(
        () => new Set()
    );
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

    const removeCartMutation = useMutation<
        CartResponse,
        Error,
        number,
        { previousCart?: CartResponse }
    >({
        mutationFn: (itemId) => cartApi.removeItem(itemId),
        onMutate: async (itemId) => {
            await queryClient.cancelQueries({ queryKey: ["cart"] });
            const previousCart = queryClient.getQueryData<CartResponse>(["cart"]);

            if (previousCart) {
                const items = previousCart.items.filter((item) => item.id !== itemId);
                queryClient.setQueryData<CartResponse>(["cart"], {
                    ...previousCart,
                    items,
                    total: calculateCartTotal(items),
                });
            }

            return { previousCart };
        },
        onSuccess: (updatedCart) => {
            queryClient.setQueryData(["cart"], updatedCart);
        },
        onError: (_error, _itemId, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(["cart"], context.previousCart);
            }
            addNotification("error", "Không thể xóa sản phẩm khỏi giỏ hàng.");
        },
    });

    const flushQuantityUpdate = async (itemId: number) => {
        const update = pendingQuantityUpdates.current.get(itemId);
        if (!update || update.isSaving) {
            return;
        }

        update.isSaving = true;
        const quantityBeingSaved = update.latestQuantity;
        let didSave = false;

        try {
            const updatedCart = await cartApi.updateItem(itemId, quantityBeingSaved);
            const latestUpdate = pendingQuantityUpdates.current.get(itemId);

            if (latestUpdate === update && latestUpdate.latestQuantity === quantityBeingSaved) {
                queryClient.setQueryData(["cart"], updatedCart);
                didSave = true;
            }
        } catch {
            const latestUpdate = pendingQuantityUpdates.current.get(itemId);
            if (latestUpdate === update && latestUpdate.latestQuantity === quantityBeingSaved) {
                queryClient.setQueryData<CartResponse>(["cart"], (currentCart) => {
                    if (!currentCart) {
                        return currentCart;
                    }
                    const items = currentCart.items.map((item) =>
                        item.id === itemId
                            ? {
                                  ...item,
                                  quantity: update.originalQuantity,
                                  subtotal: Number(item.price) * update.originalQuantity,
                              }
                            : item
                    );
                    return { ...currentCart, items, total: calculateCartTotal(items) };
                });
                pendingQuantityUpdates.current.delete(itemId);
                setPendingQuantityItemIds((current) => {
                    const next = new Set(current);
                    next.delete(itemId);
                    return next;
                });
                addNotification("error", "Không thể cập nhật số lượng sản phẩm.");
            }
        } finally {
            update.isSaving = false;
            const latestUpdate = pendingQuantityUpdates.current.get(itemId);

            if (latestUpdate === update) {
                if (latestUpdate.latestQuantity !== quantityBeingSaved) {
                    void flushQuantityUpdate(itemId);
                } else if (didSave) {
                    pendingQuantityUpdates.current.delete(itemId);
                    setPendingQuantityItemIds((current) => {
                        const next = new Set(current);
                        next.delete(itemId);
                        return next;
                    });
                }
            }
        }
    };

    const queueQuantityUpdate = (itemId: number, quantity: number) => {
        const cartToUpdate = queryClient.getQueryData<CartResponse>(["cart"]);
        const cartItem = cartToUpdate?.items.find((item) => item.id === itemId);
        if (!cartToUpdate || !cartItem) {
            return;
        }

        const nextQuantity = Math.min(cartItem.stock, Math.max(1, quantity));
        if (nextQuantity === cartItem.quantity) {
            return;
        }

        const items = cartToUpdate.items.map((item) =>
            item.id === itemId
                ? {
                      ...item,
                      quantity: nextQuantity,
                      subtotal: Number(item.price) * nextQuantity,
                  }
                : item
        );
        queryClient.setQueryData<CartResponse>(["cart"], {
            ...cartToUpdate,
            items,
            total: calculateCartTotal(items),
        });

        let update = pendingQuantityUpdates.current.get(itemId);
        if (!update) {
            update = {
                originalQuantity: cartItem.quantity,
                latestQuantity: nextQuantity,
                timer: null,
                isSaving: false,
            };
            pendingQuantityUpdates.current.set(itemId, update);
        } else {
            update.latestQuantity = nextQuantity;
        }

        if (update.timer) {
            clearTimeout(update.timer);
        }
        setPendingQuantityItemIds((current) => new Set(current).add(itemId));
        update.timer = setTimeout(() => {
            update!.timer = null;
            void flushQuantityUpdate(itemId);
        }, 250);
    };

    useEffect(
        () => () => {
            pendingQuantityUpdates.current.forEach((update) => {
                if (update.timer) {
                    clearTimeout(update.timer);
                }
            });
        },
        []
    );

    const changeItemQuantity = (itemId: number, quantity: number) => {
        if (isAuthenticated) {
            queueQuantityUpdate(itemId, quantity);
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
                                                                <CartItemThumbnail item={item} />
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
                                                                                item.quantity <= 1 ||
                                                                                removeCartMutation.isPending
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
                                                                                item.quantity >= item.stock ||
                                                                                removeCartMutation.isPending
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
                                                                        disabled={
                                                                            (isAuthenticated && item.id < 0) ||
                                                                            pendingQuantityItemIds.has(item.id) ||
                                                                            removeCartMutation.isPending
                                                                        }
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