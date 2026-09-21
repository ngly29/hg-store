"use client";

import Link from "next/link";
import styles from "./SideBar.module.css";
import { LayoutDashboard, LogOut, Package, ShoppingCart, Tag, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Sản phẩm', icon: Package },
    { href: '/admin/categories', label: 'Danh mục', icon: Tag },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
    { href: '/admin/users', label: 'Người dùng', icon: Users },
]
export default function SideBarAdmin(){
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const handleLogout = () => {
        logout();
        router.push('/admin/login');
    }
    return(
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>ADMIN PANEL</h1>
            </div>
            <nav className={styles.nav}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}
                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <Icon className={styles.navIcon}/>
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
            <div className={styles.logout}>
                <button onClick={handleLogout}> <LogOut/> Đăng xuất</button>
            </div>
        </div>
    )
}