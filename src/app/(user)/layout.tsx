import Header from "@/components/user/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main style={{paddingTop:"80px"}}>{children}</main>
    </>
  );
}