"use client";

import Link from "next/link";
import styles from "./Header.module.css";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
    { href: '/', label: 'HOME'},
    { href: '/about', label: 'ABOUT' },
    { href: '/categories', label: 'CATEGORIES' },
    { href: '/account', label:'ACCOUNT' }
]
export default function HeaderUser() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <div className={styles.brand}>
                        <Link href="/"><p>HUGAN</p></Link>
                    </div>
                    <div className={styles.menu}>
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                                    <p>{item.label}</p>
                                </Link>
                            )
                        })}
                    </div>
                    <div className={styles.action}>
                        <div className={styles.search}>
                            <Search/>
                        </div>
                        <div className={styles.cart}>
                            <ShoppingBag/>
                        </div>

                        {/*Hamburger */}
                        <button onClick={() => setOpen(!open)} className={styles.hamburger} aria-label="Menu">
                            {open ? <X/> : <Menu/>}
                        </button>
                    </div>
                </div>

                {open && (
                    <div className={styles.mobileMenu}>
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link href={item.href} key={item.href} className={`${styles.mobileNavItem} ${isActive ? styles.active : ""}`}
                                onClick={() => setOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}