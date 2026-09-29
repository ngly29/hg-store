"use client";

import { AxiosError } from "axios";
import { productApi } from "@/lib/productApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useNotification } from "@/stores/notificationStore";
import { cartApi } from "@/lib/cartApi";
import RecommendedProducts from "./RecomendedProducts";
import type { CartItemResponse, CartResponse } from "@/types/cart";
import { useAuthStore } from "@/stores/authStore";
import {
  addGuestCartItem,
  calculateCartTotal,
  createEmptyCart,
  readGuestCart,
} from "@/lib/guestCart";

type AddToCartVariables = {
  variantId: number;
  quantity: number;
  item: Omit<CartItemResponse, "id" | "subtotal">;
  isAuthenticated: boolean;
};

export default function ProductDetail(){
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addNotification } = useNotification();
  const [showDescription, setShowDescription] = useState(false);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const addToCartMutation = useMutation({
    mutationFn: async ({
      variantId,
      quantity,
      isAuthenticated: authenticated,
    }: AddToCartVariables): Promise<CartResponse | null> => {
      if (!authenticated) {
        return null;
      }
      return cartApi.addToCart({ variantId, quantity });
    },
    onMutate: async ({
      variantId,
      quantity,
      item,
      isAuthenticated: authenticated,
    }: AddToCartVariables) => {
      if (!authenticated) {
        const guestCart = addGuestCartItem(
          readGuestCart(),
          item,
          quantity
        );
        queryClient.setQueryData(["guest-cart"], guestCart);
        return { previousCart: undefined, isGuestCart: true as const };
      }

      await queryClient.cancelQueries({ queryKey: ["cart"] });

      const previousCart = queryClient.getQueryData<CartResponse>(["cart"]);
      const currentCart = previousCart ?? createEmptyCart();

      const existingItem = currentCart.items.find(
        (cartItem) => cartItem.variantId === variantId
      );

      const items = existingItem
        ? currentCart.items.map((cartItem) =>
            cartItem.variantId === variantId
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
            ...currentCart.items,
            {
              ...item,
              id: -variantId,
              subtotal: item.price * quantity,
            },
          ];

      queryClient.setQueryData<CartResponse>(["cart"], {
        ...currentCart,
        items,
        total: calculateCartTotal(items),
      });

      return { previousCart, isGuestCart: false as const };
    },
    onError: (error, _variables, context) => {
      if (!context?.isGuestCart) {
        if (context?.previousCart) {
          queryClient.setQueryData(["cart"], context.previousCart);
        } else {
          queryClient.removeQueries({ queryKey: ["cart"], exact: true });
        }
      }

      if (!(error instanceof AxiosError && error.response?.status === 401)) {
        addNotification("error", "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      }
    },
    onSuccess: (updatedCart, variables) => {
      if (updatedCart) {
        const optimisticImage =
          queryClient
            .getQueryData<CartResponse>(["cart"])
            ?.items.find((item) => item.variantId === variables.variantId)?.imgUrl ??
          variables.item.imgUrl;
        const items = updatedCart.items.map((item) =>
          item.variantId === variables.variantId && !item.imgUrl
            ? { ...item, imgUrl: optimisticImage }
            : item
        );
        queryClient.setQueryData<CartResponse>(["cart"], {
          ...updatedCart,
          items,
          total: calculateCartTotal(items),
        });
      }
      addNotification("success", "Đã thêm sản phẩm vào giỏ hàng.");
    },
  });
  // const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const params = useParams();
  const id = Number(params.id);

  const {
    data: product,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });
  // Ảnh
  const getImageSrc = (
    imageData: string | null,
    contentType: string | null
  ) => {
    if(!imageData) return "";

    if(imageData.startsWith("data:") || imageData.startsWith("http")) {
      return imageData;
    }

    return `data:${contentType || "image/jpeg"};base64,${imageData}`;
  }
  // Màu sản phẩm
  const colors = useMemo(() => {
    return Array.from(
      new Set(product?.variants?.map((variant) => variant.color).filter(Boolean))
    );
  }, [product?.variants]);

  // Size 
  const sizes = useMemo(() => {
    return Array.from(
      new Set(
        product?.variants?.map((variant) => variant.size).filter(Boolean)
      )
    );
  }, [product?.variants]);

  const selectVariant = useMemo(() => {
    if(!selectedColor || !selectedSize){
      return null;
    }

    return product?.variants?.find(
      (variant) => variant.color === selectedColor && 
      variant.size === selectedSize
    ) ?? null;
  }, [product?.variants, selectedColor, selectedSize]);
  // Giảm số lượng
  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };
  // Tăng số lượng
  const increaseQuantity = () => {
    if(!selectVariant || selectVariant.stock < 1) return;

    setQuantity((prev) => 
    Math.min(selectVariant.stock, prev + 1));
  };

  // Chuyển ảnh
  // const nextImage = () => {
  //   const images = product?.images;

  //   if (!images || images.length === 0) return;

  //   setCurrentImageIndex((prev) =>
  //     prev === images.length - 1 ? 0 : prev + 1
  //   );
  // };

  // const previousImage = () => {
  //   const images = product?.images;

  //   if (!images || images.length === 0) return;

  //   setCurrentImageIndex((prev) =>
  //     prev === 0 ? images.length - 1 : prev - 1
  //   );
  // };

  const handleAddToCart = () => {
    if(!hasHydrated) {
      addNotification("info", "Đang tải trạng thái tài khoản. Vui lòng thử lại.");
      return;
    }

    if(!product || !selectVariant) {
      addNotification("warning", "Vui lòng chọn màu và size");
      return;
    }

    if (selectVariant.stock < 1 || quantity > selectVariant.stock) {
      addNotification("warning", "Số lượng sản phẩm không còn đủ trong kho.");
      return;
    }

    try {
      const currentCart = isAuthenticated
        ? queryClient.getQueryData<CartResponse>(["cart"]) ?? createEmptyCart()
        : readGuestCart();
      const existingQuantity =
        currentCart.items.find(
          (item) => item.variantId === selectVariant.id
        )?.quantity ?? 0;
      if (existingQuantity + quantity > selectVariant.stock) {
        addNotification("warning", "Số lượng trong giỏ hàng đã đạt giới hạn tồn kho.");
        return;
      }
    } catch {
      addNotification("error", "Không thể đọc giỏ hàng. Vui lòng tải lại trang.");
      return;
    }

    const firstImage =
      product.images?.find((image) => image.isPrimary) ??
      product.images?.[0];
    const item: Omit<CartItemResponse, "id" | "subtotal"> = {
      variantId: selectVariant.id,
      productName: product.name,
      size: selectVariant.size,
      color: selectVariant.color,
      imgUrl: selectVariant.imgUrl || (firstImage
        ? getImageSrc(firstImage.imageData, firstImage.contentType)
        : null),
      price: selectVariant.price ?? product.price,
      quantity,
      stock: selectVariant.stock,
    };

    addToCartMutation.mutate({
      variantId: selectVariant.id,
      quantity,
      item,
      isAuthenticated,
    });
  }
  if(isLoading) return <div className={styles.isLoading}>Đang tải dữ liệu...</div>

  if(isError) return <div className={styles.isError}>Không thể tải dữ liệu!</div>

  if(!product) return <div className={styles.notFoundProduct}>Không tìm thấy sản phẩm!</div>
  
  return (
    <div className={styles.container}>
      <div className={styles.titleHeader}>
          <Link href="/">Home</Link>/
          <p>{product.name}</p>
      </div>
      <div className={styles.wrapper}>

        <div className={styles.imageGallery}>
          {product.images && product.images.length > 0 && (
            product.images.map((image) => (
              <img
                key={image.id}
                src={getImageSrc(
                  image.imageData,
                  image.contentType
                )}
                alt={product.name}
                className={styles.productImage}
              />
            ))
          )}
        </div>

        <div className={styles.info}>
          
          <div className={styles.title}>
            <h1>{product.name}</h1>
          
            <span><b>{product.price.toLocaleString("vi-VN")} đ</b></span>
          </div>

          <div className={styles.optionGroups}>
            <div className={styles.options}>
              {colors.map((color) => (
                <button key={color} type="button" onClick={() => {
                  if (selectedColor !== color) setQuantity(1);
                  setSelectedColor(color);
                }}
                className={selectedColor === color ? styles.selected : ""}>
                  {color}
                </button>
              ))}
            </div>

            <div className={styles.options}>
              {sizes.map((size) => (
                <button key={size} type="button" onClick={() => {
                  if (selectedSize !== size) setQuantity(1);
                  setSelectedSize(size);
                }}
                className={selectedSize === size ? styles.selected : ""}>
                  {size}
                </button>
              ))}
            </div>
            
            <div className={styles.quantitySection}>
              <div className={styles.quantityControl}>
                <button type="button" onClick={decreaseQuantity} disabled={quantity <= 1}>-</button>
                <span>{quantity}</span>
                <button type="button" onClick={increaseQuantity} disabled={!selectVariant || quantity >= selectVariant.stock}>+</button>
              </div>
              <span className={styles.note}>
                {selectVariant
                  ? `Còn ${selectVariant.stock} sản phẩm`
                  : "Vui lòng chọn màu và size"}
              </span>

              <button
                onClick={handleAddToCart}
                type="button"
                className={styles.addToCart}
                disabled={
                  addToCartMutation.isPending ||
                  (selectVariant !== null && selectVariant.stock < 1)
                }
                aria-busy={addToCartMutation.isPending}
              >
                {addToCartMutation.isPending ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>
            </div>
          </div>
          
          <div className={styles.description}>
            <p><b>Mô tả:</b></p>
            <p className={!showDescription ? styles.descriptionCollapsed : ""}>{product.description}</p>

            <button type="button" onClick={() => setShowDescription((prev) => !prev)} className={styles.descriptionButton}>
              {showDescription ? <div className={styles.chevron}><ChevronUp/> Thu gọn</div> : <div className={styles.chevron}><ChevronDown/>Xem thêm</div>}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.areaRecommend}>
        <RecommendedProducts currentProductId={product.id}/>
      </div>
    </div>
  )
}