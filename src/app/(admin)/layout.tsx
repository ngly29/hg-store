"use client";

import { useAuthStore } from "@/stores/authStore";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminRootLayout({ children }: { children: React.ReactNode}){
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const _hasHydrated = useAuthStore((state) => state._hasHydrated);

    useEffect(() => {
        if(!_hasHydrated) return;
        
        if(pathname === '/admin/login'){
            setIsChecking(false);
            return;
        } // Admin không cần check

        if(!isAuthenticated || user?.role !== 'ADMIN'){
            router.push('/admin/login');
            return;
        } // Các route khác yêu cầu quyền admin

        setIsChecking(false);
    }, [_hasHydrated, isAuthenticated, user, pathname, router]);

    if(isChecking || !_hasHydrated){
        return (
            <div>
                <p>Đang kiểm tra quyền...</p>
            </div>
        )
    }
    return <>{children}</>
}