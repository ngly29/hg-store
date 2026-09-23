"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useUserRegister } from "@/hooks/useUserRegister";
import styles from "../login/page.module.css";

export default function RegisterPage() {
  const { formData, loading, updateField, handleRegister } = useUserRegister();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister();
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.brand}>
          <h2><Link href="/">HUGAN STORE</Link></h2>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Họ và tên"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.inputWrapper}>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Số điện thoại"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.passwordToggle}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.login}>
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} /> Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>

            <div className={styles.register}>
              <Link href="/login">Đã có tài khoản? Đăng nhập</Link>
            </div>

            <div className={styles.backHome}>
              <p><Link href="/">Quay lại và tiếp tục mua sắm</Link></p>
            </div>
          </form>
        </div>
      </div>

      <div className={styles.footer}>
        <p>Copyright &copy; HUGAN {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
