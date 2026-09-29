"use client";

import styles from "./page.module.css";

export default function AboutPage() {
    return(
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.map}>
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4454.8255896665505!2d105.87201811143397!3d21.078352485991317!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135a98604046155%3A0x11f974f5a6a920df!2sChung%20c%C6%B0%20Eurowindow%20River%20Park!5e1!3m2!1svi!2s!4v1790664462459!5m2!1svi!2s" 
                        width="100%" height="100%" 
                        allowFullScreen={true}
                        loading="lazy" 
                        referrerPolicy="strict-origin-when-cross-origin">
                    </iframe>
                </div>

                <div className={styles.info}>
                    <h1>Thông tin liên hệ</h1>
                    <div className={styles.river}><h1></h1></div>
                    <h2>Địa chỉ cơ sở</h2>
                    <p>Eurowindow River Park / Đông Anh / Hà Nội</p>
                    <h2>Email</h2>
                    <p>example@gmail.com</p>
                    <h2>Phone</h2>
                    <p>+84.xxxx.xxxxx</p>
                    <h2>Thời gian làm việc</h2>
                    <p>Thứ 2 - Chủ nhật / 8 giờ - 22 giờ</p>
                </div>
            </div>
        </div>
    )
}