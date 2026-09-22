"use client";

import { categoryApi } from "@/lib/categoryApi";
import { productApi } from "@/lib/productApi";
import { useNotification } from "@/stores/notificationStore";
import { ProductImageResponse, ProductRequest, ProductResponse, VariantRequest } from "@/types/product";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./EditProduct.module.css";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const { addNotification } = useNotification();
    const productId = Number(params?.id);

    const [formData, setFormData] = useState<ProductRequest>({
        name: '',
        description: '',
        price: 0,
        imgUrl: '',
        isPublished: true,
        categoryId: 0,
        variants: [],
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [galleryImages, setGalleryImages] = useState<string[]>(Array(4).fill(''));
    const [productImages, setProductImages] = useState<ProductImageResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const primaryImage = productImages.find((image) => image.isPrimary);
    const secondaryGalleryImages = productImages.filter((image) => !image.isPrimary);

    const fetchCategories = async () => {
        try {
            const data = await categoryApi.getAll();
            setCategories(data);
        } catch {
            addNotification('error', 'Không thể tải danh mục!');
        }
    };

    const refreshProductImages = async () => {
        if (!productId) return;

        try {
            const product: ProductResponse = await productApi.getById(productId);
            const images = product.images ?? [];

            setProductImages(images);
            setGalleryImages(Array.from({ length: 4 }, (_, index) => images[index]?.imageData || ''));
            setFormData((prev) => ({
                ...prev,
                imgUrl: product.imgUrl || prev.imgUrl || '',
            }));
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Không thể tải ảnh sản phẩm!');
        }
    };

    const fetchProduct = async () => {
        if (!productId) return;

        try {
            setIsLoading(true);
            const product: ProductResponse = await productApi.getById(productId);

            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: Number(product.price) || 0,
                imgUrl: product.imgUrl || '',
                isPublished: typeof product.isPublished === 'boolean' ? product.isPublished : true,
                categoryId: Number(product.categoryId) || 0,
                variants: Array.isArray(product.variants)
                    ? product.variants.map((variant) => ({
                        size: variant.size || '',
                        color: variant.color || '',
                        price: Number(variant.price) || 0,
                        stock: Number(variant.stock) || 0,
                        sku: variant.sku || '',
                        imgUrl: variant.imgUrl || '',
                    }))
                    : [],
            });

            setProductImages(product.images ?? []);
            setGalleryImages(Array.from({ length: 4 }, (_, index) => {
                const image = product.images?.[index]?.imageData || '';
                return image;
            }));
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Không thể tải thông tin sản phẩm!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProduct();
    }, [productId]);

    const handleAddVariant = () => {
        setFormData((prev) => ({
            ...prev,
            variants: [
                ...(prev.variants ?? []),
                {
                    size: '',
                    color: '',
                    price: prev.price,
                    stock: 0,
                    sku: '',
                    imgUrl: '',
                },
            ],
        }));
    };

    const handleRemoveVariant = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            variants: (prev.variants ?? []).filter((_, i) => i !== index),
        }));
    };

    const handleVariantChange = (
        index: number,
        field: keyof VariantRequest,
        value: string | number
    ) => {
        setFormData((prev) => {
            const newVariants = [...(prev.variants ?? [])];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return { ...prev, variants: newVariants };
        });
    };

    const togglePublished = () => {
        setFormData((prev) => ({
            ...prev,
            isPublished: !prev.isPublished,
        }));
    };

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

    const handleUpdateProduct = async () => {
        try {
            setIsSubmitting(true);
            const payload = normalizeProductPayload(formData);
            await productApi.putProductById(productId, payload);
            addNotification('success', 'Cập nhật sản phẩm thành công!');
            router.push('/admin/products');
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Cập nhật sản phẩm thất bại!');
        } finally {
            setIsSubmitting(false);
        }
    };

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

        handleUpdateProduct();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        try {
            const uploaded = await productApi.uploadProductImage(productId, file, true);
            setFormData((prev) => ({ ...prev, imgUrl: uploaded.imageData || prev.imgUrl }));
            await productApi.getById(productId).then((freshProduct) => {
                setFormData((prev) => ({
                    ...prev,
                    imgUrl: freshProduct.imgUrl || prev.imgUrl,
                }));
            });
            addNotification('success', 'Upload ảnh chính thành công!');
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Upload ảnh thất bại!');
        }
    };

    const handleGalleryImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        index: number
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addNotification('error', 'Chỉ chấp nhận file ảnh!');
            return;
        }

        try {
            await productApi.uploadProductImage(productId, file, index === 0);
            await refreshProductImages();
            addNotification('success', 'Tải ảnh lên thành công!');
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Tải ảnh thất bại!');
        } finally {
            e.target.value = '';
        }
    };

    const handleUploadMultipleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const invalid = files.some((file) => !file.type.startsWith('image/'));
        if (invalid) {
            addNotification('error', 'Chỉ chấp nhận file ảnh!');
            e.target.value = '';
            return;
        }

        try {
            await productApi.uploadProductImages(productId, files);
            await refreshProductImages();
            addNotification('success', `Đã upload ${files.length} ảnh thành công!`);
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Upload ảnh thất bại!');
        } finally {
            e.target.value = '';
        }
    };

    const handleSetPrimaryImage = async (imageId: number) => {
        try {
            await productApi.setPrimaryImage(productId, imageId);
            await refreshProductImages();
            addNotification('success', 'Đã đặt ảnh chính thành công!');
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Không thể đặt ảnh chính!');
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
            return;
        }

        try {
            await productApi.deleteProductImage(productId, imageId);
            await refreshProductImages();
            addNotification('success', 'Xóa ảnh thành công!');
        } catch (error: any) {
            addNotification('error', error?.response?.data?.message || error?.message || 'Xóa ảnh thất bại!');
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <Loader2 className={styles.spinner} />
                <span>Đang tải dữ liệu sản phẩm...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Chỉnh sửa sản phẩm</h1>
                </div>
            </div>

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
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                <div className={styles.switchRow}>
                                    <button
                                        type="button"
                                        onClick={togglePublished}
                                        className={`${styles.switch} ${Boolean(formData.isPublished) ? styles.switchOn : styles.switchOff}`}
                                        aria-label="Thay đổi trạng thái sản phẩm"
                                        aria-pressed={Boolean(formData.isPublished)}
                                    >
                                        <span className={styles.switchThumb} />
                                    </button>
                                    <span className={styles.switchText}>
                                        {formData.isPublished ? 'Đang hiển thị' : 'Đã ẩn'}
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
                                    value={formData.description ?? ''}
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
                                        onChange={handleFileChange}
                                        className={styles.fileInput}
                                    />
                                    {formData.imgUrl ? (
                                        <div className={styles.previewWrap}>
                                            <img src={formData.imgUrl} alt="Preview" className={styles.preview} />
                                            {primaryImage && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteImage(primaryImage.id)}
                                                    className={styles.removeImageButton}
                                                >
                                                    Xóa ảnh bìa
                                                </button>
                                            )}
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
                                            onChange={handleUploadMultipleImages}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                <div className={styles.galleryGrid}>
                                    {secondaryGalleryImages.length > 0 ? (
                                        secondaryGalleryImages.map((image) => (
                                            <div key={image.id} className={styles.galleryItem} style={{ position: 'relative' }}>
                                                <img src={image.imageData || ''} alt={image.fileName || 'Product gallery'} className={styles.galleryThumb} />
                                                <div style={{ position: 'absolute', left: 6, right: 6, bottom: 6, display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetPrimaryImage(image.id)}
                                                        style={{
                                                            flex: 1,
                                                            border: 'none',
                                                            borderRadius: 6,
                                                            background: image.isPrimary ? '#10b981' : '#111827',
                                                            color: '#fff',
                                                            fontSize: 11,
                                                            padding: '6px 4px',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {image.isPrimary ? 'Ảnh chính' : 'Đặt làm chính'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage(image.id)}
                                                        style={{
                                                            flex: 1,
                                                            border: 'none',
                                                            borderRadius: 6,
                                                            background: '#ef4444',
                                                            color: '#fff',
                                                            fontSize: 11,
                                                            padding: '6px 4px',
                                                            cursor: 'pointer',
                                                        }}
                                                        aria-label={`Xóa ảnh ${image.fileName || 'phụ'}`}
                                                    >
                                                        Xóa ảnh
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        galleryImages.map((item, index) => (
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
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Biến thể ({formData.variants.length})</h2>
                        <button type="button" onClick={handleAddVariant} className={styles.btnAddVariant}>
                            <Plus size={18} /> Thêm biến thể
                        </button>
                    </div>

                    {formData.variants.length === 0 ? (
                        <div className={styles.emptyVariants}>Chưa có biến thể nào. Nhấn “Thêm biến thể” để bắt đầu.</div>
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
                                                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                                    placeholder="S/M/L"
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={variant.color}
                                                    onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                                    placeholder="Đen/Trắng"
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={variant.price ?? 0}
                                                    onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={variant.stock ?? 0}
                                                    onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                                    placeholder="AT-S-DEN"
                                                    className={styles.inputSmall}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveVariant(index)}
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

                <div className={styles.actions}>
                    <Link href="/admin/products" className={styles.btnCancel}>
                        Hủy
                    </Link>
                    <button type="submit" disabled={isSubmitting} className={styles.btnSubmit}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className={styles.spinner} /> Đang lưu...
                            </>
                        ) : (
                            'Lưu thay đổi'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
