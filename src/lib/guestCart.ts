import type { CartItemResponse, CartResponse } from "@/types/cart";

const GUEST_CART_STORAGE_KEY = "hg-guest-cart";

export function createEmptyCart(): CartResponse {
  return { id: 0, items: [], total: 0 };
}

export function calculateCartTotal(items: CartItemResponse[]): number {
  return items.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );
}

export function readGuestCart(): CartResponse {
  if (typeof window === "undefined") {
    return createEmptyCart();
  }

  const storedCart = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
  if (!storedCart) {
    return createEmptyCart();
  }

  const parsed: unknown = JSON.parse(storedCart);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("items" in parsed) ||
    !Array.isArray(parsed.items)
  ) {
    throw new Error("Dữ liệu giỏ hàng trên trình duyệt không hợp lệ.");
  }

  const items = parsed.items as CartItemResponse[];
  return {
    id: 0,
    items,
    total: calculateCartTotal(items),
  };
}

export function saveGuestCart(cart: CartResponse): CartResponse {
  const normalizedCart = {
    ...cart,
    id: 0,
    total: calculateCartTotal(cart.items),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      GUEST_CART_STORAGE_KEY,
      JSON.stringify(normalizedCart)
    );
  }

  return normalizedCart;
}

export function addGuestCartItem(
  cart: CartResponse,
  item: Omit<CartItemResponse, "id" | "subtotal">,
  quantity: number
): CartResponse {
  const existingItem = cart.items.find(
    (cartItem) => cartItem.variantId === item.variantId
  );
  const items = existingItem
    ? cart.items.map((cartItem) =>
        cartItem.variantId === item.variantId
          ? {
              ...cartItem,
              quantity: Math.min(
                cartItem.stock,
                cartItem.quantity + quantity
              ),
              subtotal:
                Math.min(cartItem.stock, cartItem.quantity + quantity) *
                cartItem.price,
            }
          : cartItem
      )
    : [
        ...cart.items,
        {
          ...item,
          id: -item.variantId,
          subtotal: item.price * quantity,
        },
      ];

  return saveGuestCart({ ...cart, items });
}

export function updateGuestCartItem(
  cart: CartResponse,
  itemId: number,
  quantity: number
): CartResponse {
  const items = cart.items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          quantity: Math.min(item.stock, Math.max(1, quantity)),
          subtotal:
            Math.min(item.stock, Math.max(1, quantity)) * item.price,
        }
      : item
  );

  return saveGuestCart({ ...cart, items });
}

export function removeGuestCartItem(
  cart: CartResponse,
  itemId: number
): CartResponse {
  return saveGuestCart({
    ...cart,
    items: cart.items.filter((item) => item.id !== itemId),
  });
}

export function getCartImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl?.trim()) {
    return null;
  }

  const value = imageUrl.trim();
  if (value.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${value}`;
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    (value.startsWith("/") && !value.startsWith("/9j/")) ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const mimeType = value.startsWith("iVBORw0KGgo")
      ? "image/png"
      : value.startsWith("UklGR")
        ? "image/webp"
        : value.startsWith("R0lGOD")
          ? "image/gif"
          : "image/jpeg";

  return `data:${mimeType};base64,${value}`;
}
