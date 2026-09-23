"use client";

import { useUserLogin } from "@/hooks/useUserLogin";
import { useState } from "react";
import styles from "./page.module.css";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UserLoginPage() {
  const {formData, loading, updateField, handleLogin} = useUserLogin();
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
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
                <input type="email" value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Email" required />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.inputWrapper}>
                <input type={showPassword ? 'text' : 'password'} value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Mật khẩu" required/>
                <button type="button"onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
                  {showPassword ? <EyeOff/> : <Eye/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.login}>
              {loading ? (
                <>
                  <Loader2 className={styles.spinner}/> Đang đăng nhập...
                </>
              ) : ("Đăng nhập")}
            </button>
            {/* <div className={styles.divider}>
              <span>Hoặc</span>
            </div> */}
            <div className={styles.register}>
              <Link href="/register">
                Đăng ký tài khoản
              </Link>
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
  )
}