"use client";

import SideBarAdmin from "@/components/admin/layout/SideBar";
import { useAuthStore } from "@/stores/authStore";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import styles from "@/components/admin/layout/AdminLayout.module.css";

export default function AdminLayout({ children }: { children: ReactNode  }){
    const pathname = usePathname();
    const { user} = useAuthStore();

    // Không hiển thị sidebar cho login
    if(pathname === '/admin/login'){
        return <>{children}</>
    }

    return(
        <div className={styles.container}>
            <SideBarAdmin />

            <div className={styles.main}>
                <header className={styles.header}>
                    <p>Xin chào, {user?.fullName}</p>
                </header>

                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    )
}