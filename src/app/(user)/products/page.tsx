"use client";

import { productApi } from "@/lib/productApi";
import { getProductImageUrl } from "@/lib/productImage";
import { ProductResponse } from "@/types/product";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProductPage() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDataProduct = async () => {
            try {
                const res = await productApi.getAll();
                setProducts(res);
            } catch(error: any){
                setError(error.message || "Có lỗi xảy ra!");
            } finally {
                setLoading(false);
            }
        }
        fetchDataProduct();
    }, []);

    if(loading) return <div className={styles.loading}><Loader2 className={styles.spinner} />Đang tải dữ liệu...</div>
    if(error) return <div className={styles.error}>{error}</div>

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.title}>
                    <h1>NEW ARRIVALS</h1>
                </div>

                <div className={styles.displayProducts}>
                    {products.map((product) => (
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
                    ))}
                </div>
            </div>
        </div>
    )
}