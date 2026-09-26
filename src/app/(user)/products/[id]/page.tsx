"use client";

import { productApi } from "@/lib/productApi";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProductDetail(){
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const params = useParams();
  const id = Number(params.id);

  const {
    data: product,
    isLoading,
    isError,
    error
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

    if(imageData.startsWith("data")) {
      return imageData;
    }

    return `data:${contentType};base64,${imageData}`;
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
  //Reset về 1
  useEffect(() => {
    setQuantity(1);
  }, [selectVariant?.id]);
  // Giảm số lượng
  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };
  // Tăng số lượng
  const increaseQuantity = () => {
    if(!selectVariant) return;

    setQuantity((prev) => 
    Math.min(selectVariant.stock, prev + 1));
  };

  // Chuyển ảnh
  const nextImage = () => {
    const images = product?.images;

    if (!images || images.length === 0) return;

    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    const images = product?.images;

    if (!images || images.length === 0) return;

    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

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
                <button key={color} type="button" onClick={() => setSelectedColor(color)}
                className={selectedColor === color ? styles.selected : ""}>
                  {color}
                </button>
              ))}
            </div>

            <div className={styles.options}>
              {sizes.map((size) => (
                <button key={size} type="button" onClick={() => setSelectedSize(size)}
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
            </div>
          </div>
          
          <div className={styles.description}>
            <p><b>Mô tả:</b></p>
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}