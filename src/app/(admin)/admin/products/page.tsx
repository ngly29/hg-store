"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import styles from "./page.module.css";
import { productApi } from "@/lib/productApi";
import { useEffect, useMemo, useState } from "react";
import { useNotification } from "@/stores/notificationStore";
import { ProductResponse } from "@/types/product";
import Table, {Column} from "@/components/table/page";
import { Search } from "lucide-react";
import Link from "next/link";

export default function ProductPage(){
    const { addNotification } = useNotification();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const {data: products, isLoading, isError} = useQuery({
        queryKey: ["products"],
        queryFn: productApi.getAll
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

    const productColumns: Column<ProductResponse>[] = [
        {
            title: "STT",
            render: (_product: ProductResponse, index: number) => index + 1,
            width: 60
        },
        {
            key: "imgUrl",
            title: "Ảnh",
            render: (product: ProductResponse) => (
                <img 
                    src={product.imgUrl}
                    alt={product.name}
                    width={60}
                    height={60}
                    style={{boxShadow:"0 2px 8px rgba(0, 0, 0, 0.08)"}}
                />
            ),
            width: 60
        },
        {
            key: "name",
            title: "Tên sản phẩm",
            width: 350
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
                <span className={product.isPublished ? styles.published : styles.hidden}>
                    {product.isPublished ? 'Đang bán' : 'Đã ẩn'}
                </span>
            ),
        },
        {
            title: "Hành động",
            render: (product: ProductResponse) => (
                <div className={styles.actionGroup}>
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
            width: 160
        },
    ];

    useEffect(() => {
        if(isError){
            addNotification('error', 'Có lỗi xảy ra!');
        }
    }, [isError, addNotification]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!searchTerm.trim()) return products;

        const term = searchTerm.toLowerCase().trim();
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                p.categoryName?.toLowerCase().includes(term)
        );
    }, [products, searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
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
                {currentProducts.length === 0 ? (
                    <div className={styles.empty}>
                        {searchTerm ? 'Không tìm thấy sản phẩm nào!' : 'Chưa có sản phẩm nào!'}
                    </div>
                ) : (
                    <Table data={currentProducts} columns={productColumns} />
                )}
            </div>
            {filteredProducts.length > 0 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}{' '}
                        / {filteredProducts.length} sản phẩm
                    </div>

                    <div className={styles.paginationControls}>
                        {/* Page size */}
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className={styles.pageSize}
                        >
                            <option value={5}>5 / trang</option>
                        </select>

                        {/* Previous */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={styles.pageBtn}
                        >
                            Trước
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                                // Hiển thị: trang đầu, trang cuối, trang hiện tại ± 1
                                return (
                                    page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1
                                );
                            })
                            .map((page, index, array) => {
                                // Thêm dấu ... giữa các khoảng
                                const prevPage = array[index - 1];
                                const showEllipsis = prevPage && page - prevPage > 1;

                                return (
                                    <span key={page}>
                                        {showEllipsis && (
                                            <span className={styles.ellipsis}>...</span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`${styles.pageBtn} ${
                                                currentPage === page ? styles.active : ''
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </span>
                                );
                            })}

                        {/* Next */}
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
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