"use client";

import { authApi } from "@/lib/authApi";
import { useAuthStore } from "@/stores/authStore";
import { useNotification } from "@/stores/notificationStore";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import styles from "./page.module.css";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, Paintbrush } from "lucide-react";
import { UserResponse } from "@/types/auth";

export default function AdminLoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [formData, setFormData] = useState({ email: '', password: ''});
    const [showPassword, setShowPassword] = useState(false);
    
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {e.preventDefault(); setLoading(true);
        try {
            const response = await authApi.login(formData);
            // Kiểm tra role
            if(response.role !== 'ADMIN'){
                addNotification('error', 'Bạn không có quyền truy cập!');
                setLoading(false);
                return;
            }

            const user: UserResponse = {
                userId: response.userId,
                email: response.email,
                phone: response.phone,
                fullName: response.fullName,
                role: response.role,
            };

            setAuth(user, response.token);
            addNotification('success', 'Đăng nhập thành công!');
            router.push('/admin');
        } catch(err: any){
            addNotification('error', err?.response?.data?.message || err?.message || 'Đăng nhập thất bại!');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className={styles.container}>
            <div className={styles.cardLeft}>
                <Paintbrush/>
                <h1>MY LIFE MY COLOR</h1>
                <p>Copyright &copy; HUGAN {new Date().getFullYear()}</p>
            </div>
            <div className={styles.cardRight}>
                <div className={styles.header}>
                    <h1>Admin zone</h1>
                    <p>Dành cho quản trị viên</p>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/*Email */}
                    <div className={styles.field}>
                        <label>Email</label>
                        <div className={styles.inputWrapper}>
                            <input type="email" value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="Email" required
                            />
                        </div>
                    </div>
                    {/*Password*/}
                    <div className={styles.field}>
                        <label>Mật khẩu</label>
                        <div className={styles.inputWrapper}>
                            <input type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value})}
                            placeholder="••••••••"
                            required
                            />
                            <button type="button" className={styles.btnShowPassword}
                            onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff/> : <Eye/>}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className={styles.btnSubmit}>
                        {loading ? (
                            <>
                                <Loader2 className={styles.spinner}/>
                                <span>Đang đăng nhập...</span>
                            </>
                        ) : (
                            <span>Đăng nhập</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}