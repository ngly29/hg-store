"use client";

import api from "@/lib/api";
import { useEffect, useState } from "react";

interface Product{
  id: number;
  name: string;
}
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    const load = async() => {
      const res = await api.get("/categories");
      setProducts(res.data);
    };
    load();
  }, []);
  return(
    // <div>
    //   {products.map((p)=>(
    //     <p key={p.id}>{p.name}</p>
    //   ))}
    // </div>

    /* TEST: Call api */
    JSON.stringify(products)
  )
}