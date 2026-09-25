import Footer from "@/components/user/layout/footer";
import Header from "@/components/user/layout/Header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Header />
      <main style={{paddingTop:"80px", paddingBottom:"60px", flex:1}}>{children}</main>
      <Footer/>
    </div>
  );
}