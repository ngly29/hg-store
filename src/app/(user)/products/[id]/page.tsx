"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { productApi } from "@/lib/productApi";
import { ProductImageResponse } from "@/types/product";

import styles from "./page.module.css";

const getImageSrc = (
  imageData: string | null,
  contentType: string | null
) => {
  if (!imageData) return "";

  if (imageData.startsWith("data:")) {
    return imageData;
  }

  return `data:${contentType};base64,${imageData}`;
};

export default function ProductDetailPage() {
  const params = useParams();

  const id = Number(params.id);

  // =========================
  // STATE
  // =========================

  const [selectedImage, setSelectedImage] =
    useState<ProductImageResponse | null>(null);

  const [selectedColor, setSelectedColor] = useState("");

  const [selectedSize, setSelectedSize] = useState("");

  const [quantity, setQuantity] = useState(1);

  // =========================
  // GET PRODUCT
  // =========================

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.getById(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  // =========================
  // SET PRIMARY IMAGE
  // =========================

  useEffect(() => {
    if (!product?.images?.length) {
      setSelectedImage(null);
      return;
    }

    const primaryImage =
      product.images.find(
        (image) => image.isPrimary === true
      ) ?? product.images[0];

    setSelectedImage(primaryImage);
  }, [product]);

  // =========================
  // LOADING / ERROR
  // =========================

  if (isLoading) {
    return (
      <main className={styles.container}>
        <p>Đang tải sản phẩm...</p>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className={styles.container}>
        <p>Không tìm thấy sản phẩm.</p>
      </main>
    );
  }

  // =========================
  // COLORS
  // =========================

  const colors = [
    ...new Set(
      product.variants?.map(
        (variant) => variant.color
      ) ?? []
    ),
  ];

  // =========================
  // SIZES
  // =========================

  const sizes = [
    ...new Set(
      product.variants?.map(
        (variant) => variant.size
      ) ?? []
    ),
  ];

  // =========================
  // SELECTED VARIANT
  // =========================

  const selectedVariant = product.variants?.find(
    (variant) =>
      variant.color === selectedColor &&
      variant.size === selectedSize
  );

  // =========================
  // DISPLAY PRICE
  // =========================

  const displayPrice =
    selectedVariant?.price ?? product.price;

  // =========================
  // CHECK SIZE AVAILABLE
  // =========================

  const isSizeAvailable = (size: string) => {
    // Nếu chưa chọn màu thì tất cả size
    // vẫn có thể được chọn
    if (!selectedColor) {
      return product.variants?.some(
        (variant) =>
          variant.size === size &&
          variant.stock > 0
      );
    }

    return product.variants?.some(
      (variant) =>
        variant.color === selectedColor &&
        variant.size === size &&
        variant.stock > 0
    );
  };

  // =========================
  // SELECT COLOR
  // =========================

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);

    // Reset size vì variant có thể thay đổi
    setSelectedSize("");

    // Reset quantity
    setQuantity(1);
  };

  // =========================
  // SELECT SIZE
  // =========================

  const handleSelectSize = (size: string) => {
    if (!isSizeAvailable(size)) {
      return;
    }

    setSelectedSize(size);

    // Reset quantity khi đổi variant
    setQuantity(1);
  };

  // =========================
  // DECREASE QUANTITY
  // =========================

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  // =========================
  // INCREASE QUANTITY
  // =========================

  const handleIncreaseQuantity = () => {
    if (!selectedVariant) {
      return;
    }

    if (quantity >= selectedVariant.stock) {
      return;
    }

    setQuantity((prev) => prev + 1);
  };

  // =========================
  // ADD TO CART
  // =========================

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert("Vui lòng chọn màu và kích thước.");
      return;
    }

    if (selectedVariant.stock <= 0) {
      alert("Sản phẩm đã hết hàng.");
      return;
    }

    if (quantity > selectedVariant.stock) {
      alert("Số lượng sản phẩm không đủ.");
      return;
    }

    const cartItem = {
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
    };

    console.log("Cart item:", cartItem);

    alert("Đã thêm sản phẩm vào giỏ hàng.");
  };

  return (
    <main className={styles.container}>
      <div className={styles.productDetail}>

        {/* =========================
            IMAGE SECTION
        ========================= */}

        <div className={styles.imageSection}>

          {/* MAIN IMAGE */}

          <div className={styles.mainImage}>
            {selectedImage ? (
              <img
                src={getImageSrc(
                  selectedImage.imageData,
                  selectedImage.contentType
                )}
                alt={product.name}
              />
            ) : (
              <div>
                Không có hình ảnh
              </div>
            )}
          </div>

          {/* THUMBNAILS */}

          {product.images &&
            product.images.length > 0 && (
              <div className={styles.thumbnailList}>
                {product.images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() =>
                      setSelectedImage(image)
                    }
                    className={
                      selectedImage?.id === image.id
                        ? styles.activeThumbnail
                        : styles.thumbnail
                    }
                  >
                    <img
                      src={getImageSrc(
                        image.imageData,
                        image.contentType
                      )}
                      alt={
                        image.fileName ??
                        product.name
                      }
                    />
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* =========================
            PRODUCT INFORMATION
        ========================= */}

        <div className={styles.productInfo}>

          {/* NAME */}

          <h1>{product.name}</h1>

          {/* CATEGORY */}

          {product.categoryName && (
            <p>
              Danh mục: {product.categoryName}
            </p>
          )}

          {/* PRICE */}

          <p className={styles.price}>
            {displayPrice.toLocaleString("vi-VN")}đ
          </p>

          {/* DESCRIPTION */}

          {product.description && (
            <p className={styles.description}>
              {product.description}
            </p>
          )}

          {/* =========================
              COLOR
          ========================= */}

          {colors.length > 0 && (
            <div className={styles.optionGroup}>
              <h3>Màu</h3>

              <div className={styles.options}>
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={
                      selectedColor === color
                        ? styles.selectedOption
                        : styles.option
                    }
                    onClick={() =>
                      handleSelectColor(color)
                    }
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =========================
              SIZE
          ========================= */}

          {sizes.length > 0 && (
            <div className={styles.optionGroup}>
              <h3>Kích thước</h3>

              <div className={styles.options}>
                {sizes.map((size) => {
                  const available =
                    isSizeAvailable(size);

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!available}
                      className={
                        selectedSize === size
                          ? styles.selectedOption
                          : styles.option
                      }
                      onClick={() =>
                        handleSelectSize(size)
                      }
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================
              SELECTED VARIANT
          ========================= */}

          {selectedVariant && (
            <div className={styles.variantInfo}>
              <p>
                Còn lại:{" "}
                <strong>
                  {selectedVariant.stock}
                </strong>{" "}
                sản phẩm
              </p>

              <p>
                SKU:{" "}
                <strong>
                  {selectedVariant.sku}
                </strong>
              </p>
            </div>
          )}

          {/* =========================
              QUANTITY
          ========================= */}

          {selectedVariant &&
            selectedVariant.stock > 0 && (
              <div className={styles.quantitySection}>
                <h3>Số lượng</h3>

                <div className={styles.quantity}>
                  <button
                    type="button"
                    onClick={
                      handleDecreaseQuantity
                    }
                    disabled={quantity <= 1}
                  >
                    -
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={
                      handleIncreaseQuantity
                    }
                    disabled={
                      quantity >=
                      selectedVariant.stock
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            )}

          {/* =========================
              ADD TO CART
          ========================= */}

          <button
            type="button"
            className={styles.addToCart}
            onClick={handleAddToCart}
            disabled={
              !!selectedVariant &&
              selectedVariant.stock <= 0
            }
          >
            {!selectedVariant
              ? "Chọn màu và kích thước"
              : selectedVariant.stock <= 0
              ? "Hết hàng"
              : "Thêm vào giỏ hàng"}
          </button>
        </div>
      </div>
    </main>
  );
}