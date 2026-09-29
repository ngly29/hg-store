import styles from "./checkout.module.css";

export default function CheckoutLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div className={styles.checkoutLayout}>{children}</div>;
}
