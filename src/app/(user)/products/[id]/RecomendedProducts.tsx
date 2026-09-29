import { productApi } from "@/lib/productApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import styles from "./RecomendedProducts.module.css";
import { ProductResponse } from "@/types/product";
import Link from "next/link";

interface RecommendedProductsProps {
    currentProductId?: number;
}

export default function RecommendedProducts({currentProductId}: RecommendedProductsProps){
    const {
        data: products,
        isLoading
    } = useQuery({
        queryKey: ['recommended-products'],
        queryFn: () => productApi.getAll(),
    });

    const recommendedProducts = useMemo(() => {
        if(!products || products.length === 0){
            return [];
        }

        const otherProducts = products.filter((product) => product.id !== currentProductId);

        return [...otherProducts].sort(() => Math.random() - 0.5).slice(0, 6);
    }, [products, currentProductId]);

    const getProductImageUrl = (product: ProductResponse) => {
        const image = product.images?.[0];
        if(!image?.imageData){
            return "";
        }
        if(image.imageData.startsWith("data:")){
            return image.imageData;
        }
        return `data:${image.contentType};base64,${image.imageData}`;
    }

    if(isLoading || recommendedProducts.length === 0){
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.title}>
                    <h2>Đề xuất</h2>
                </div>

                <div className={styles.displayProducts}>
                    {recommendedProducts.map((product) => (
                        <Link
                            href={`/products/${product.id}`}
                            key={product.id}
                            className={styles.productCard}
                        >
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

                                <span>
                                    <b>
                                        {product.price.toLocaleString("vi-VN")} đ
                                    </b>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}