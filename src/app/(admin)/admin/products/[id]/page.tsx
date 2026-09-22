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
            <div className={styles.headerRow}>
                <Link href="/admin/products" className={styles.backLink}>
                    <ArrowLeft size={16} />
                    Quay lại
                </Link>

                <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => router.push(`/admin/products/edit-product/${product.id}`)}
                >
                    <PencilLine size={16} /> Chỉnh sửa
                </button>
            </div>

            <div className={styles.card}>
                <div className={styles.topSection}>
                    <div className={styles.imageBlock}>
                        {primaryImage?.imageData ? (
                            <img src={primaryImage.imageData} alt={product.name} className={styles.mainImage} />
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
                                <Tag size={14} /> {product.categoryName || "Chưa phân loại"}
                            </span>
                        </div>

                        <h1 className={styles.title}>{product.name}</h1>

                        <div className={styles.priceRow}>
                            <span className={styles.label}>Giá:</span>
                            <strong>{Number(product.price || 0).toLocaleString("vi-VN")} đ</strong>
                        </div>

                        <div className={styles.metaGrid}>
                            <div>
                                <span className={styles.label}>Danh mục</span>
                                <p>{product.categoryName || "Chưa có danh mục"}</p>
                            </div>
                            <div>
                                <span className={styles.label}>Slug</span>
                                <p>{product.slug || "-"}</p>
                            </div>
                            <div>
                                <span className={styles.label}>ID sản phẩm</span>
                                <p>#{product.id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.sectionBlock}>
                    <h2>Mô tả</h2>
                    <p className={styles.description}>
                        {product.description?.trim() ? product.description : "Không có mô tả cho sản phẩm này."}
                    </p>
                </div>

                <div className={styles.sectionBlock}>
                    <h2>Ảnh sản phẩm</h2>
                    {product.images && product.images.length > 0 ? (
                        <div className={styles.galleryGrid}>
                            {product.images.map((image) => (
                                <div key={image.id} className={styles.galleryItem}>
                                    <img src={image.imageData || ""} alt={image.fileName || product.name} className={styles.galleryThumb} />
                                    {image.isPrimary && <span className={styles.primaryBadge}>Ảnh chính</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noGallery}>Chưa có ảnh nào cho sản phẩm này.</div>
                    )}
                </div>

                {product.variants && product.variants.length > 0 && (
                    <div className={styles.sectionBlock}>
                        <h2>Biến thể</h2>
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
                                        <tr key={variant.id ?? `${variant.size}-${variant.color}-${variant.sku}`}>
                                            <td>{variant.size || "-"}</td>
                                            <td>{variant.color || "-"}</td>
                                            <td>{Number(variant.price || 0).toLocaleString("vi-VN")} đ</td>
                                            <td>{variant.stock ?? 0}</td>
                                            <td>{variant.sku || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
