"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";

import { categoryApi } from "@/lib/categoryApi";
import { useNotification } from "@/stores/notificationStore";
import { CategoryResponse } from "@/types/category";
import styles from "./page.module.css";

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function CategoryPage() {
    const { addNotification } = useNotification();
    const queryClient = useQueryClient();
    const [formName, setFormName] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const {
        data: categories = [],
        isLoading,
        isError,
    } = useQuery<CategoryResponse[]>({
        queryKey: ["categories"],
        queryFn: categoryApi.getAll,
    });

    const filteredCategories = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) {
            return categories;
        }

        return categories.filter((category) => {
            const name = category.name?.toLowerCase() ?? "";
            const slug = category.slug?.toLowerCase() ?? "";
            return name.includes(keyword) || slug.includes(keyword);
        });
    }, [categories, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [totalPages]);

    const currentItems = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredCategories.slice(start, start + pageSize);
    }, [filteredCategories, safePage, pageSize]);

    const resetForm = () => {
        setFormName("");
        setEditingId(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = formName.trim();

        if (!name) {
            addNotification("error", "Vui lòng nhập tên danh mục!");
            return;
        }

        try {
            setIsSubmitting(true);

            if (editingId !== null) {
                await categoryApi.updateById(editingId, { name });
                addNotification("success", "Cập nhật danh mục thành công!");
            } else {
                await categoryApi.create({ name });
                addNotification("success", "Tạo danh mục thành công!");
            }

            await queryClient.invalidateQueries({ queryKey: ["categories"] });
            resetForm();
        } catch (error: any) {
            addNotification(
                "error",
                error?.response?.data?.message ||
                    error?.message ||
                    "Không thể lưu danh mục!"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (category: CategoryResponse) => {
        setEditingId(category.id);
        setFormName(category.name);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            return;
        }

        try {
            await categoryApi.deleteById(id);
            await queryClient.invalidateQueries({ queryKey: ["categories"] });
            if (editingId === id) {
                resetForm();
            }
            addNotification("success", "Xóa danh mục thành công!");
        } catch (error: any) {
            addNotification(
                "error",
                error?.response?.data?.message ||
                    error?.message ||
                    "Xóa danh mục thất bại!"
            );
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div>
                    <p className={styles.eyebrow}>Quản lý</p>
                    <h1 className={styles.title}>Danh mục</h1>
                </div>
            </div>

            <div className={styles.contentGrid}>
                <form onSubmit={handleSubmit} className={styles.card}>
                    <div className={styles.formHeader}>
                        <h2>{editingId !== null ? "Cập nhật danh mục" : "Thêm danh mục"}</h2>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="category-name" className={styles.label}>
                            Tên danh mục
                        </label>
                        <input
                            id="category-name"
                            type="text"
                            value={formName}
                            onChange={(event) => setFormName(event.target.value)}
                            placeholder="VD: Áo thun, Giày thể thao..."
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.actionRow}>
                        <button
                            type="submit"
                            className={styles.primaryButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                editingId !== null ? "Đang cập nhật..." : "Đang tạo..."
                            ) : editingId !== null ? (
                                "Cập nhật"
                            ) : (
                                <>
                                    <PlusCircle size={16} />
                                    Thêm mới
                                </>
                            )}
                        </button>

                        {editingId !== null && (
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={resetForm}
                            >
                                <X size={16} />
                                Hủy
                            </button>
                        )}
                    </div>
                </form>

                <div className={styles.card}>
                    <div className={styles.tableHeaderRow}>
                        <h2>Danh sách danh mục</h2>
                        <div className={styles.searchBox}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Tìm theo tên hoặc mã danh mục"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className={styles.emptyState}>Đang tải danh mục...</div>
                    ) : isError ? (
                        <div className={styles.emptyState}>Không thể tải danh mục.</div>
                    ) : currentItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            {searchTerm ? "Không tìm thấy danh mục phù hợp." : "Chưa có danh mục nào."}
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>STT</th>
                                            <th>Tên danh mục</th>
                                            <th>Mã danh mục</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((category, index) => (
                                            <tr key={category.id}>
                                                <td>{(safePage - 1) * pageSize + index + 1}</td>
                                                <td>{category.name}</td>
                                                <td>{category.slug || "-"}</td>
                                                <td>
                                                    <div className={styles.actionGroup}>
                                                        <button
                                                            type="button"
                                                            className={styles.editButton}
                                                            onClick={() => handleEdit(category)}
                                                        >
                                                            <Pencil size={14} />
                                                            Sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={styles.deleteButton}
                                                            onClick={() => handleDelete(category.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.paginationBar}>
                                <div className={styles.paginationInfo}>
                                    Hiển thị {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredCategories.length)} / {filteredCategories.length} danh mục
                                </div>

                                <div className={styles.paginationControls}>
                                    <select
                                        value={pageSize}
                                        onChange={(event) => {
                                            setPageSize(Number(event.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className={styles.pageSizeSelect}
                                    >
                                        {PAGE_SIZE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option} / trang
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        className={styles.pageButton}
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    >
                                        Trước
                                    </button>

                                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            className={`${styles.pageButton} ${safePage === page ? styles.pageButtonActive : ""}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        className={styles.pageButton}
                                        disabled={safePage === totalPages}
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
