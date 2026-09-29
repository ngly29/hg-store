"use client";

import { productApi } from "@/lib/productApi";
import { categoryApi } from "@/lib/categoryApi";
import { getProductImageUrl } from "@/lib/productImage";
import type { CategoryResponse } from "@/types/category";
import type { ProductResponse } from "@/types/product";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProductPage() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [category, setCategory] = useState<CategoryResponse | null>(null);

    useEffect(() => {
        const syncFilters = () => {
            const params = new URLSearchParams(window.location.search);
            const parsedCategoryId = Number(params.get("categoryId"));
            setSearchQuery(params.get("search")?.trim() ?? "");
            setCategoryId(
                Number.isInteger(parsedCategoryId) && parsedCategoryId > 0
                    ? parsedCategoryId
                    : null
            );
        };
        const handleProductSearch = (event: Event) => {
            const query = (event as CustomEvent<string>).detail;
            setSearchQuery(typeof query === "string" ? query.trim() : "");
            setCategoryId(null);
        };

        syncFilters();
        window.addEventListener("popstate", syncFilters);
        window.addEventListener("product-search", handleProductSearch);

        return () => {
            window.removeEventListener("popstate", syncFilters);
            window.removeEventListener("product-search", handleProductSearch);
        };
    }, []);

    useEffect(() => {
        let isCurrent = true;

        const fetchDataProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const [productResult, categoryResult] = await Promise.all([
                    productApi.getAll(categoryId === null ? {} : { categoryId }),
                    categoryId === null
                        ? Promise.resolve(null)
                        : categoryApi.getById(categoryId),
                ]);
                if (isCurrent) {
                    setProducts(productResult);
                    setCategory(categoryResult);
                }
            } catch(fetchError) {
                if (isCurrent) {
                    setError(fetchError instanceof Error ? fetchError.message : "Có lỗi xảy ra!");
                }
            } finally {
                if (isCurrent) {
                    setLoading(false);
                }
            }
        }
        void fetchDataProduct();

        return () => {
            isCurrent = false;
        };
    }, [categoryId]);

    const filteredProducts = useMemo(() => {
        const query = searchQuery.toLocaleLowerCase("vi");
        if (!query) {
            return products;
        }

        return products.filter((product) =>
            product.name.toLocaleLowerCase("vi").includes(query)
        );
    }, [products, searchQuery]);

    if(loading) return <div className={styles.loading}><Loader2 className={styles.spinner} />Đang tải dữ liệu...</div>
    if(error) return <div className={styles.error}>{error}</div>

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.title}>
                    <h1>{category?.name ?? (categoryId ? "CATEGORY" : "NEW ARRIVALS")}</h1>
                    {categoryId && (
                        <Link className={styles.clearCategory} href="/categories">
                            Xem tất cả danh mục
                        </Link>
                    )}
                </div>

                <div className={styles.displayProducts}>
                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                        <Link href={`/products/${product.id}`} key={product.id} className={styles.productCard}>
                            <div className={styles.productImage}>
                                <img
                                    alt={product.name}
                                    src={getProductImageUrl(product)}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        objectFit: "contain",
                                        transition: "transform 0.4s ease-in-out",
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                />
                            </div>
                            <div className={styles.info}>
                                <h3>{product.name}</h3>
                                <span><b>{product.price.toLocaleString('vi-VN')} đ</b></span>
                            </div>
                        </Link>
                    )) : (
                        <p role="status">
                            {searchQuery
                                ? `Không tìm thấy sản phẩm phù hợp với "${searchQuery}".`
                                : "Hiện chưa có sản phẩm."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}