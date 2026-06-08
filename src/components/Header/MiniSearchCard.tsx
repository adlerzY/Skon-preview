// فایل: src/components/MiniSearchCard.tsx
import Image from "next/image";
import Link from "next/link";
import { ProductNode } from "@/lib/graphql";

export default function MiniSearchCard({ product }: { product: ProductNode }) {
  const categoryName = product.productCategories?.nodes?.[0]?.name || "دسته بندی نامشخص";
  const isOnSale = Boolean(product.parsedRegularPrice && product.parsedPrice && product.parsedRegularPrice > product.parsedPrice);

  return (
    <Link 
      href={`/product/${product.slug}`} 
      prefetch={false}
      className="flex items-center gap-3 p-1 bg-brand-surface hover:bg-brand-surface_hover transition-colors group"
      aria-label={product.name}
    >
      <div className="relative w-[60px] h-[60px] overflow-hidden shrink-0 bg-[#111215]">
        {product.image?.sourceUrl ? (
           <Image 
             src={product.image.sourceUrl} 
             alt={product.name} 
             fill 
             className="object-cover group-hover:scale-110 transition-transform duration-300"
             sizes="50px"
             quality={70}
           />
        ) : (
           <div className="flex w-full h-full text-[10px] items-center justify-center text-white/20">عکس</div>
        )}
        {isOnSale && (
          <div className="absolute top-0 right-0 bg-brand-sabz text-black text-[10px] px-1 m-0.5 rounded-sm z-10">
            حراج
          </div>
        )}
      </div>

      <div className="flex flex-col overflow-hidden w-full gap-0.5">
        <span className="text-m_khonsa text-[12px] block truncate">
          {categoryName}
        </span>
        <h4 className="text-white text-[14px] truncate group-hover:text-brand-blue transition-colors">
          {product.name}
        </h4>
        {product.parsedPrice ? (
          <div className="mt-0.5 text-[12px] flex items-center gap-1">
            <span className="text-[#ffb400] font-bold">{product.parsedPrice.toLocaleString("fa-IR")} تومان</span>
            {isOnSale && (
              <del className="text-brand-m_khonsa opacity-70">{product.parsedRegularPrice?.toLocaleString("fa-IR")}</del>
            )}
          </div>
        ) : (
          <span className="mt-0.5 text-[12px] text-brand-m_khonsa">ناموجود</span>
        )}
      </div>
    </Link>
  );
}