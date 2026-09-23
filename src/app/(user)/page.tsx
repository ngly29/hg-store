"use client";

import { productApi } from "@/lib/productApi";
import { useAuthStore } from "@/stores/authStore";
import { ProductResponse } from "@/types/product";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductPage from "./user/products/page";

export default function Page(){
    const [products, setProducts] = useState<ProductResponse[]>();
    const fetchDataProduct = async () => {
        const res = await productApi.getAll();
        setProducts(res);
    }

    useEffect(() => {
        fetchDataProduct();
    }, []);

    const { logout } = useAuthStore();
    const router = useRouter();
    const handleLogout = () => {
        logout();
        router.push("/login");
    }
    return (
        <div>
            <ProductPage/>
        </div>
    )
}