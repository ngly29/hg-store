"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import styles from "./page.module.css";
import { productApi } from "@/lib/productApi";
import { useEffect, useState } from "react";
import { useNotification } from "@/stores/notificationStore";
import { ProductResponse } from "@/types/product";
import Table, {Column} from "@/components/table/page";
import { Search } from "lucide-react";
import Link from "next/link";

export default function ProductPage(){
    const { addNotification } = useNotification();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const { data: products = [], isLoading, isError } = useQuery<ProductResponse[]>({
        queryKey: ["products", currentPage, pageSize, searchTerm],
        queryFn: () => productApi.getAll({
            page: currentPage,
            size: pageSize,
            search: searchTerm.trim() || null,
            sort: "createdAt,desc",
        }),
    });

    const handleDeleteProduct = async (productId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            return;
        }

        try {
            await productApi.deleteProductById(productId);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            addNotification('success', 'Xóa sản phẩm thành công!');
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Xóa sản phẩm thất bại!');
        }
    };

    const handleTogglePublish = async (product: ProductResponse) => {
        try {
            await productApi.togglePublish(product.id);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            addNotification('success', product.isPublished ? 'Đã ẩn sản phẩm' : 'Đã hiển thị sản phẩm');
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Cập nhật trạng thái thất bại!');
        }
    };

    const productColumns: Column<ProductResponse>[] = [
        {
            key: "imgUrl",
            title: "Ảnh",
            render: (product: ProductResponse) => {
                const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];
                const imageUrl = primaryImage?.imageData || product.imgUrl || '';

                return (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        width={60}
                        height={60}
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', objectFit: 'cover' }}
                    />
                );
            },
            width: 60
        },
        {
            key: "name",
            title: "Tên sản phẩm",
            width: 350,
            render: (product: ProductResponse) => (
                <Link href={`/admin/products/${product.id}`} className={styles.productNameLink}>
                    {product.name}
                </Link>
            )
        },
        {
            key: "categoryName",
            title: "Danh mục"
        },
        {
            key: "price",
            title: "Giá",
            render: (product: ProductResponse) => (
                `${product.price.toLocaleString("vi-VN")} đ`
            )
        },
        {
            key: "isPublished",
            title: "Trạng thái",
            render: (product) => (
                <button
                    type="button"
                    className={product.isPublished ? styles.published : styles.hidden}
                    onClick={() => handleTogglePublish(product)}
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 999 }}
                >
                    {product.isPublished ? 'Đang bán' : 'Đã ẩn'}
                </button>
            ),
        },
        {
            title: "Hành động",
            render: (product: ProductResponse) => (
                <div className={styles.actionGroup}>
                    <Link href={`/admin/products/${product.id}`} className={styles.detailBtn}>
                        Chi tiết
                    </Link>
                    <Link href={`/admin/products/edit-product/${product.id}`} className={styles.editBtn}>
                        Sửa
                    </Link>
                    <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteProduct(product.id)}
                    >
                        Xóa
                    </button>
                </div>
            ),
            width: 180
        },
    ];

    useEffect(() => {
        if(isError){
            addNotification('error', 'Có lỗi xảy ra!');
        }
    }, [isError, addNotification]);

    const hasPreviousPage = currentPage > 0;
    const hasNextPage = products.length === pageSize;

    useEffect(() => {
        setCurrentPage(0);
    }, [searchTerm, pageSize]);

    if(isLoading) return <div className={styles.loading}>Đang tải...</div>
    if(isError) return <div className={styles.error}>Không thể tải dữ liệu!</div>
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <h1>Danh sách sản phẩm</h1>
                </div>
                <div className={styles.action}>
                    <div className={styles.search}>
                        <input type="text" placeholder="Tìm kiếm theo tên, danh mục"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                        <Search/>
                    </div>
                    <div>
                        <Link href="/admin/products/create-product" className={styles.create}>
                            Thêm mới
                        </Link>
                    </div>
                </div>
            </div>
            <div className={styles.table}>
                {products.length === 0 ? (
                    <div className={styles.empty}>
                        {searchTerm ? 'Không tìm thấy sản phẩm nào!' : 'Chưa có sản phẩm nào!'}
                    </div>
                ) : (
                    <Table data={products} columns={productColumns} />
                )}
            </div>
            {products.length > 0 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        Trang {currentPage + 1} • {products.length} sản phẩm
                    </div>

                    <div className={styles.paginationControls}>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className={styles.pageSize}
                        >
                            <option value={5}>5 / trang</option>
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                        </select>

                        <button
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            disabled={!hasPreviousPage}
                            className={styles.pageBtn}
                        >
                            Trước
                        </button>

                        <button
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={!hasNextPage}
                            className={styles.pageBtn}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}