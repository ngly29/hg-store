"use client";

import Link from "next/link";
import styles from "./Header.module.css";
import { Search, ShoppingBag } from "lucide-react";

export default function HeaderUser() {
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <div className={styles.brand}>
                        <p>HUGAN</p>
                    </div>
                    <div className={styles.menu}>
                        <ul>
                            <li><Link href="/">HOME</Link></li>
                            <li><Link href="/about">ABOUT</Link></li>
                            <li><Link href="/categories">CATEGORIES</Link></li>
                        </ul>
                    </div>
                    <div className={styles.action}>
                        <div className={styles.search}>
                            <Search/>
                        </div>
                        <div className={styles.cart}>
                            <ShoppingBag/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}