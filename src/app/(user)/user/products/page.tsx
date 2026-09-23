"use client";

import { productApi } from "@/lib/productApi";
import { ProductResponse } from "@/types/product";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { Loader2 } from "lucide-react";
import Image from "next/image";

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
                        <div key={product.id} className={styles.productCard}>
                            <div className={styles.productImage}>
                                <Image alt={product.name} src={product.imgUrl || "/images/placeholder.png"} width={200} height={200}/>
                            </div>
                            <div className={styles.info}>
                                <p>{product.name}</p>
                                <span>{product.price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}