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
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [coverFile, setCoverFile] = useState<File | null>(null);
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

    const formVariants: VariantRequest[] = Array.isArray(formData.variants) ? formData.variants : [];

    const handleAddVariant = () => {
        setFormData((prev) => {
            const currentVariants: VariantRequest[] = Array.isArray(prev.variants) ? prev.variants : [];
            return {
                ...prev,
                variants: [
                    ...currentVariants,
                    {
                        size: '',
                        color: '',
                        price: prev.price,
                        stock: 0,
                        sku: '',
                        imgUrl: '',
                    }
                ]
            };
        });
    }

    const handleRemoveVariant = (index: number) => {
        setFormData((prev) => {
            const currentVariants: VariantRequest[] = Array.isArray(prev.variants) ? prev.variants : [];
            return {
                ...prev,
                variants: currentVariants.filter((_, i) => i !== index),
            };
        });
    };

    const handleVariantChange = (
        index: number, field: keyof VariantRequest, value: string | number
    ) => {
        setFormData((prev) => {
            const currentVariants: VariantRequest[] = Array.isArray(prev.variants) ? prev.variants : [];
            const newVariants = [...currentVariants];
            newVariants[index] = { ...newVariants[index], [field]: value } as VariantRequest;
            return { ...prev, variants: newVariants };
        });
    };
    // Tạo sản phẩm
    const normalizeProductPayload = (payload: ProductRequest): ProductRequest => ({
        name: payload.name.trim(),
        description: payload.description?.trim() || '',
        price: Number(payload.price) || 0,
        imgUrl: payload.imgUrl?.trim() || '',
        isPublished: payload.isPublished ?? false,
        categoryId: Number(payload.categoryId) || 0,
        variants: (payload.variants ?? []).map((variant) => ({
            ...variant,
            size: variant.size?.trim() || '',
            color: variant.color?.trim() || '',
            sku: variant.sku?.trim() || '',
            price: variant.price != null ? Number(variant.price) : null,
            stock: variant.stock != null ? Number(variant.stock) : null,
            imgUrl: variant.imgUrl?.trim() || '',
        })),
    });

    const handleCreateProduct = async() => {
        try {
            setIsSubmitting(true);
            const payload = normalizeProductPayload(formData);
            const createdProduct = await productApi.postProduct(payload);

            if (coverFile) {
                await productApi.uploadProductImage(createdProduct.id, coverFile, true);
            }

            if (galleryFiles.length > 0) {
                await productApi.uploadProductImages(createdProduct.id, galleryFiles);
            }

            addNotification('success', 'Tạo sản phẩm thành công!');
            router.push("/admin/products");
        } catch (error: any){
            addNotification('error', error?.response?.data?.message || error?.message || "Tạo sản phẩm thất bại!");
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

        if (!formData.name.trim()) {
            addNotification('error', 'Vui lòng nhập tên sản phẩm');
            return;
        }

        if (Number(formData.price) <= 0) {
            addNotification('error', 'Vui lòng nhập giá sản phẩm!');
            return;
        }

        if (!formData.categoryId) {
            addNotification('error', 'Vui lòng chọn danh mục!');
            return;
        }

        const hasVariantError = (formData.variants ?? []).some((variant) => {
            return !variant.size?.trim() || !variant.color?.trim() || !variant.sku?.trim();
        });

        if ((formData.variants ?? []).length > 0 && hasVariantError) {
            addNotification('error', 'Mỗi biến thể cần có Size, Màu sắc và SKU!');
            return;
        }

        handleCreateProduct();
    };

    // Xử lý lưu ảnh
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addNotification('error', 'Chỉ chấp nhận file ảnh!');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            addNotification('error', 'File tối đa 5MB!');
            return;
        }

        setCoverFile(file);
        const objectUrl = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, imgUrl: objectUrl }));
    };

    const removeCoverImage = () => {
        setCoverFile(null);
        setFormData((prev) => ({ ...prev, imgUrl: '' }));
    };

    const removeGalleryImage = (index: number) => {
        setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
        setGalleryImages((prev) => prev.filter((_, i) => i !== index));
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

        const objectUrl = URL.createObjectURL(file);
        handleVariantChange(index, 'imgUrl', objectUrl);
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

        setGalleryFiles((prev) => {
            const next = [...prev];
            next[index] = file;
            return next;
        });

        const objectUrl = URL.createObjectURL(file);
        setGalleryImages((prev) => {
            const next = [...prev];
            next[index] = objectUrl;
            return next;
        });
    };

    const handleUploadMultipleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const invalidFiles = files.filter((file) => !file.type.startsWith('image/'));
        if (invalidFiles.length) {
            addNotification('error', 'Chỉ chấp nhận file ảnh!');
            e.target.value = '';
            return;
        }

        const nextFiles = [...galleryFiles, ...files].slice(0, 8);
        const previewUrls = nextFiles.map((file) => URL.createObjectURL(file));
        setGalleryFiles(nextFiles);
        setGalleryImages((prev) => {
            const next = [...Array(4).fill('')];
            for (let i = 0; i < previewUrls.length; i += 1) {
                next[i] = previewUrls[i];
            }
            return next;
        });

        e.target.value = '';
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
                                <div className={styles.toggleRow}>
                                    <button
                                        type="button"
                                        onClick={togglePublished}
                                        className={`${styles.publishToggle} ${formData.isPublished ? styles.publishToggleOn : styles.publishToggleOff}`}
                                        aria-label="Thay đổi trạng thái sản phẩm"
                                        aria-pressed={Boolean(formData.isPublished)}
                                    >
                                        <span className={styles.publishToggleThumb} />
                                    </button>
                                    <span className={styles.publishToggleText}>
                                        {formData.isPublished ? 'Đang bán' : 'Đã ẩn'}
                                    </span>
                                </div>
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
                                    value={String(formData.description ?? '')}
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
                                            <button
                                                type="button"
                                                onClick={removeCoverImage}
                                                className={styles.removeImageButton}
                                            >
                                                Xóa ảnh bìa
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={styles.emptyImageBox}>Chưa có ảnh bìa</div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.imageSection}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                    <label className={styles.label}>Ảnh phụ</label>
                                    <label
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            backgroundColor: '#0099FF',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Tải nhiều ảnh
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleUploadMultipleGallery}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
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
                                                <>
                                                    <img src={item} alt={`Ảnh phụ ${index + 1}`} className={styles.galleryThumb} />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGalleryImage(index)}
                                                        className={styles.removeGalleryButton}
                                                        aria-label={`Xóa ảnh phụ ${index + 1}`}
                                                    >
                                                        Xóa ảnh
                                                    </button>
                                                </>
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
                            Biến thể ({formVariants.length})
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddVariant}
                            className={styles.btnAddVariant}
                        >
                            <Plus size={18} /> Thêm biến thể
                        </button>
                    </div>

                    {formVariants.length === 0 ? (
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
                                    {formVariants.map((variant, index) => (
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
                                                    value={Number(variant.price ?? 0)}
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
                                                    value={Number(variant.stock ?? 0)}
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