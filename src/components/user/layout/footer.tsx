import Link from "next/link";
import styles from "./footer.module.css";
import { Facebook, Instagram, Tiktok, TiktokBadge } from "@thesvg/react";
import Image from "next/image";

export default function Footer(){
    return(
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.socialMedia}>
                    <Link href="https://www.facebook.com/profile.php?id=61551546884908" ><Facebook width={30} height={30} /></Link>
                    <Link href="https://www.instagram.com/hugan.official/"><Instagram width={30} height={30}/></Link>
                    <Link href="#"><TiktokBadge width={30} height={30}/></Link>
                </div>
                <div className={styles.brand}>
                    <Link href="/"><Image alt="logo" src="https://hugan.vn/wp-content/uploads/2026/09/logo-toi-uu-website-1400x788.png.webp" 
                    width={150} height={100} /></Link>
                </div>
            </div>

            <div className={styles.copyright}>
                <p>Copyright &copy; {new Date().getFullYear()} CÔNG TY CỔ PHẦN HUGAN VIỆT NAM.</p>
            </div>
        </div>
    )
}