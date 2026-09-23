"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ImageIcon, Loader2, PencilLine, Tag } from "lucide-react";
import { productApi } from "@/lib/productApi";
import { ProductResponse } from "@/types/product";
import { useNotification } from "@/stores/notificationStore";
import styles from "./page.module.css";

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addNotification } = useNotification();
    const productId = Number(params?.id);

    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;

            try {
                setIsLoading(true);
                const data = await productApi.getById(productId);
                setProduct(data);
            } catch (error: any) {
                addNotification(
                    "error",
                    error?.response?.data?.message || error?.message || "Không thể tải thông tin sản phẩm!"
                );
                router.push("/admin/products");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId, addNotification, router]);

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <Loader2 className={styles.spinner} />
                <span>Đang tải chi tiết sản phẩm...</span>
            </div>
        );
    }

    if (!product) {
        return (
            <div className={styles.emptyState}>
                <p>Không tìm thấy sản phẩm.</p>
                <Link href="/admin/products" className={styles.backLink}>
                    <ArrowLeft size={16} /> Quay lại danh sách
                </Link>
            </div>
        );
    }

    const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];
    const galleryImages = product.images?.filter((image) => !image.isPrimary) ?? [];

    return (
        <div className={styles.container}>
            {/* ===== LAYOUT ===== */}
            <div className={styles.layout}>
                {/* ===== MAIN COLUMN ===== */}
                <div className={styles.mainCol}>
                    {/* Overview card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>Thông tin chung</h2>
                        </div>

                        <div className={styles.overviewGrid}>
                            <div className={styles.imageBlock}>
                                {primaryImage?.imageData ? (
                                    <img
                                        src={primaryImage.imageData}
                                        alt={product.name}
                                        className={styles.mainImage}
                                    />
                                ) : (
                                    <div className={styles.mainImagePlaceholder}>
                                        <ImageIcon size={44} />
                                        <span>Không có ảnh</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.infoBlock}>
                                <div className={styles.statusRow}>
                                    <span className={product.isPublished ? styles.published : styles.hidden}>
                                        {product.isPublished ? "Đang bán" : "Đã ẩn"}
                                    </span>
                                    <span className={styles.categoryBadge}>
                                        <Tag size={13} /> {product.categoryName || "Chưa phân loại"}
                                    </span>
                                </div>

                                <h3 className={styles.productName}>{product.name}</h3>

                                <div className={styles.priceRow}>
                                    <span className={styles.priceLabel}>Giá bán</span>
                                    <strong className={styles.priceValue}>
                                        {Number(product.price || 0).toLocaleString("vi-VN")} đ
                                    </strong>
                                </div>

                                <div className={styles.metaGrid}>
                                    <div className={styles.metaItem}>
                                        <span className={styles.label}>Danh mục</span>
                                        <p>{product.categoryName || "Chưa có danh mục"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>Mô tả sản phẩm</h2>
                        </div>
                        <p className={styles.description}>
                            {product.description?.trim()
                                ? product.description
                                : "Không có mô tả cho sản phẩm này."}
                        </p>
                    </div>

                    {/* Gallery card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>Ảnh sản phẩm</h2>
                            {product.images && product.images.length > 0 && (
                                <span className={styles.countBadge}>{product.images.length} ảnh</span>
                            )}
                        </div>

                        {product.images && product.images.length > 0 ? (
                            <div className={styles.galleryGrid}>
                                {product.images.map((image) => (
                                    <div key={image.id} className={styles.galleryItem}>
                                        <img
                                            src={image.imageData || ""}
                                            alt={image.fileName || product.name}
                                            className={styles.galleryThumb}
                                        />
                                        {image.isPrimary && (
                                            <span className={styles.primaryBadge}>Ảnh chính</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noGallery}>Chưa có ảnh nào cho sản phẩm này.</div>
                        )}
                    </div>

                    {/* Variants card */}
                    {product.variants && product.variants.length > 0 && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Biến thể sản phẩm</h2>
                                <span className={styles.countBadge}>
                                    {product.variants.length} biến thể
                                </span>
                            </div>

                            <div className={styles.variantTableWrap}>
                                <table className={styles.variantTable}>
                                    <thead>
                                        <tr>
                                            <th>Size</th>
                                            <th>Màu</th>
                                            <th>Giá</th>
                                            <th>Tồn kho</th>
                                            <th>SKU</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.variants.map((variant) => (
                                            <tr
                                                key={
                                                    variant.id ??
                                                    `${variant.size}-${variant.color}-${variant.sku}`
                                                }
                                            >
                                                <td>{variant.size || "-"}</td>
                                                <td>{variant.color || "-"}</td>
                                                <td className={styles.priceCell}>
                                                    {Number(variant.price || 0).toLocaleString("vi-VN")} đ
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            (variant.stock ?? 0) > 0
                                                                ? styles.stockOk
                                                                : styles.stockEmpty
                                                        }
                                                    >
                                                        {variant.stock ?? 0}
                                                    </span>
                                                </td>
                                                <td className={styles.skuCell}>{variant.sku || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== SIDEBAR ===== */}
                <aside className={styles.sideCol}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>Tổng quan</h2>
                        </div>

                        <ul className={styles.summaryList}>
                            <li>
                                <span className={styles.label}>Trạng thái</span>
                                <span
                                    className={
                                        product.isPublished ? styles.published : styles.hidden
                                    }
                                >
                                    {product.isPublished ? "Đang bán" : "Đã ẩn"}
                                </span>
                            </li>
                            <li>
                                <span className={styles.label}>Danh mục</span>
                                <strong>{product.categoryName || "-"}</strong>
                            </li>
                            <li>
                                <span className={styles.label}>Giá</span>
                                <strong className={styles.priceValue}>
                                    {Number(product.price || 0).toLocaleString("vi-VN")} đ
                                </strong>
                            </li>
                            <li>
                                <span className={styles.label}>Số biến thể</span>
                                <strong>{product.variants?.length ?? 0}</strong>
                            </li>
                            <li>
                                <span className={styles.label}>Số ảnh</span>
                                <strong>{product.images?.length ?? 0}</strong>
                            </li>
                        </ul>
                    </div>

                    {/* ===== ACTION BUTTONS ===== */}
                    <div className={styles.sideActions}>
                        <Link
                            href="/admin/products"
                            className={styles.sideBtnBack}
                        >
                            <ArrowLeft size={15} />
                            Quay lại
                        </Link>

                        <button
                            type="button"
                            className={styles.sideBtnEdit}
                            onClick={() => router.push(`/admin/products/edit-product/${product.id}`)}
                        >
                            <PencilLine size={15} />
                            Chỉnh sửa
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}