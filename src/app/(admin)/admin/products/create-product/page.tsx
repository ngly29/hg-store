"use client";

import { categoryApi } from "@/lib/categoryApi";
import { productApi } from "@/lib/productApi";
import { useNotification } from "@/stores/notificationStore";
import { ProductRequest, VariantRequest } from "@/types/product";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./CreateProduct.module.css";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CreateProduct(){
    const router = useRouter();
    const { addNotification } = useNotification();

    const [formData, setFormData] = useState<ProductRequest>({
        name: '',
        description: '',
        price: 0,
        imgUrl: '',
        isPublished: true,
        categoryId:0,
        variants: [],
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [galleryImages, setGalleryImages] = useState<string[]>(Array(4).fill(''));
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Lấy danh sách category
    const fetchCategories = async() => {
        try {
            const data = await categoryApi.getAll();
            setCategories(data);
        } catch (error){
            addNotification("error", "Không thể tải danh mục!");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [addNotification]);
    // Thêm biến thể
    const handleAddVariant = () => {
        setFormData((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    size: '',
                    color: '',
                    price: prev.price,
                    stock: 0,
                    sku: '',
                    imgUrl: '',
                }
            ]
        }));
    }
    // Xóa biến thể
    const handleRemoveVariant = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index),
        }));
    };
    // Cập nhật biến thể
    const handleVariantChange = (
        index: number, field: keyof VariantRequest, value: string | number
    ) => {
        setFormData((prev) => {
            const newVariants = [...prev.variants];
            newVariants[index] = {...newVariants[index], [field]: value};
            return {...prev, variants: newVariants,};
        });
    };
    // Tạo sản phẩm
    const normalizeProductPayload = (payload: ProductRequest): ProductRequest => ({
        ...payload,
        name: payload.name.trim(),
        description: payload.description?.trim() || '',
        imgUrl: payload.imgUrl?.startsWith('data:image/') ? '' : payload.imgUrl || '',
        variants: payload.variants.map((variant) => ({
            ...variant,
            size: variant.size?.trim() || '',
            color: variant.color?.trim() || '',
            sku: variant.sku?.trim() || '',
            imgUrl: variant.imgUrl?.startsWith('data:image/') ? '' : variant.imgUrl || '',
        })),
    });

    const handleCreateProduct = async() => {
        try {
            setIsSubmitting(true);
            const payload = normalizeProductPayload(formData);
            await productApi.postProduct(payload);
            addNotification('success', 'Tạo sản phẩm thành công!');
            router.push("/admin/products");
        } catch (error: any){
            addNotification('error', error.response.data.message || error.message || "Tạo sản phẩm thất bại!");
        } finally {
            setIsSubmitting(false);
        }
    }

    const togglePublished = () => {
        setFormData((prev) => ({
            ...prev,
            isPublished: !prev.isPublished,
        }));
    };

    // Validate
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name.trim()){
            addNotification('error', 'Vui lòng nhập tên sản phẩm');
            return;
        }
        if (formData.price <= 0) { addNotification('error', 'Vui lòng nhập giá sản phẩm!'); return; }
        if (!formData.categoryId) { addNotification('error', 'Vui lòng chọn danh mục!'); return; }
        if (formData.variants.length === 0) { addNotification('error', 'Vui lòng thêm ít nhất 1 biến thể!'); return; }

        handleCreateProduct();
    };

    // Xử lý lưu ảnh
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        if (!file.type.startsWith('image/')) {
            addNotification('error', 'Chỉ chấp nhận file ảnh!');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            addNotification('error', 'File tối đa 5MB!');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            if (dataUrl.length > 255) {
                addNotification('warning', 'Ảnh upload quá lớn cho cơ sở dữ liệu, hệ thống sẽ bỏ qua ảnh này để tránh lỗi lưu trữ.');
                setFormData((prev) => ({ ...prev, imgUrl: '' }));
                return;
            }
            setFormData((prev) => ({ ...prev, imgUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
    };
    const handleVariantFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        index: number
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addNotification('error', 'Chỉ chấp nhận file ảnh!');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            if (dataUrl.length > 255) {
                addNotification('warning', 'Ảnh biến thể quá lớn, hệ thống sẽ bỏ qua ảnh này để tránh lỗi lưu dữ liệu.');
                handleVariantChange(index, 'imgUrl', '');
                return;
            }
            handleVariantChange(index, 'imgUrl', dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleGalleryImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        index: number
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addNotification('error', 'Chỉ chấp nhận file ảnh!');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setGalleryImages((prev) => {
                const next = [...prev];
                next[index] = reader.result as string;
                return next;
            });
        };
        reader.readAsDataURL(file);
    };

    return (
         <div className={styles.container}>
            {/* ═══════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ═══════════════════════════════════════════ */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div>
                        <h1 className={styles.title}>Tạo sản phẩm mới</h1>

                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* FORM */}
            {/* ═══════════════════════════════════════════ */}
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Thông tin chung</h2>

                    <div className={styles.mainLayout}>
                        <div className={styles.leftPanel}>
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Tên sản phẩm <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="VD: Áo thun nam cotton"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Danh mục <span className={styles.required}>*</span>
                                </label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            categoryId: Number(e.target.value),
                                        })
                                    }
                                    className={styles.select}
                                >
                                    <option value={0}>-- Chọn danh mục --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Trạng thái</label>
                                <button
                                    type="button"
                                    onClick={togglePublished}
                                    className={formData.isPublished ? styles.publishButtonOn : styles.publishButtonOff}
                                >
                                    {formData.isPublished ? 'Đang bán' : 'Đã ẩn'}
                                </button>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Giá cơ bản <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: Number(e.target.value),
                                        })
                                    }
                                    placeholder="250000"
                                    className={styles.input}
                                    min={0}
                                />
                            </div>

                            <div className={styles.fieldFull}>
                                <label className={styles.label}>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Mô tả chi tiết sản phẩm..."
                                    className={styles.textarea}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className={styles.rightPanel}>
                            <div className={styles.imageSection}>
                                <label className={styles.label}>Ảnh bìa</label>
                                <div className={styles.coverUpload}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e)}
                                        className={styles.fileInput}
                                    />
                                    {formData.imgUrl ? (
                                        <div className={styles.previewWrap}>
                                            <img src={formData.imgUrl} alt="Preview" className={styles.preview} />
                                        </div>
                                    ) : (
                                        <div className={styles.emptyImageBox}>Chưa có ảnh bìa</div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.imageSection}>
                                <label className={styles.label}>Ảnh phụ</label>
                                <div className={styles.galleryGrid}>
                                    {galleryImages.map((item, index) => (
                                        <div key={index} className={styles.galleryItem}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleGalleryImageChange(e, index)}
                                                className={styles.galleryInput}
                                            />
                                            {item ? (
                                                <img src={item} alt={`Ảnh phụ ${index + 1}`} className={styles.galleryThumb} />
                                            ) : (
                                                <div className={styles.galleryPlaceholder}>+</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── BIẾN THỂ ─── */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            Biến thể ({formData.variants.length})
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddVariant}
                            className={styles.btnAddVariant}
                        >
                            <Plus size={18} /> Thêm biến thể
                        </button>
                    </div>

                    {formData.variants.length === 0 ? (
                        <div className={styles.emptyVariants}>
                            Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Size</th>
                                        <th>Màu</th>
                                        <th>Giá</th>
                                        <th>Tồn kho</th>
                                        <th>SKU</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.variants.map((variant, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={variant.size}
                                                    onChange={(e) =>
                                                        handleVariantChange(
                                                            index,
                                                            'size',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="S/M/L"
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={variant.color}
                                                    onChange={(e) =>
                                                        handleVariantChange(
                                                            index,
                                                            'color',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Đen/Trắng"
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={variant.price}
                                                    onChange={(e) =>
                                                        handleVariantChange(
                                                            index,
                                                            'price',
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={(e) =>
                                                        handleVariantChange(
                                                            index,
                                                            'stock',
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(e) =>
                                                        handleVariantChange(
                                                            index,
                                                            'sku',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="AT-S-DEN"
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveVariant(index)
                                                    }
                                                    className={styles.btnRemoveVariant}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ─── ACTIONS ─── */}
                <div className={styles.actions}>

                    <Link href="/admin/products" className={styles.btnCancel}>
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={styles.btnSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className={styles.spinner} /> Đang tạo...
                            </>
                        ) : (
                            'Tạo sản phẩm'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}