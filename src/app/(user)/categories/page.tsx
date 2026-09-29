"use client";

import { categoryApi } from "@/lib/categoryApi";
import type { CategoryResponse } from "@/types/category";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        const fetchCategories = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await categoryApi.getAll();
                if (isCurrent) {
                    setCategories(result);
                    setError(null);
                }
            } catch (fetchError) {
                if (isCurrent) {
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : "Không thể tải danh mục. Vui lòng thử lại."
                    );
                }
            } finally {
                if (isCurrent) {
                    setLoading(false);
                }
            }
        };

        void fetchCategories();

        return () => {
            isCurrent = false;
        };
    }, [retryCount]);

    return (
        <section className={styles.page}>
            <div className={styles.hero}>
                <h1>CATEGORIES</h1>
            </div>

            {loading ? (
                <div className={styles.status} role="status">
                    <Loader2 className={styles.spinner} aria-hidden="true" />
                    Đang tải danh mục...
                </div>
            ) : error ? (
                <div className={styles.error} role="alert">
                    <p>{error}</p>
                    <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
                        Thử lại
                    </button>
                </div>
            ) : categories.length === 0 ? (
                <p className={styles.emptyState} role="status">
                    Hiện chưa có danh mục sản phẩm.
                </p>
            ) : (
                <div className={styles.categoryGrid}>
                    {categories.map((category, index) => (
                        <Link
                            className={styles.categoryCard}
                            href={`/products?categoryId=${category.id}`}
                            key={category.id}
                        >
                            {/* <span className={styles.categoryNumber}>
                                {String(index + 1).padStart(2, "0")}
                            </span> */}
                            <span className={styles.categoryName}>{category.name}</span>
                            <span className={styles.categoryAction}>
                                Khám phá sản phẩm
                                <ArrowRight size={18} aria-hidden="true" />
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
