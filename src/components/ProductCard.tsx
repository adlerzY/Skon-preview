import Image from "next/image";
import Link from "next/link";
import { ProductNode } from "@/lib/graphql";

const formatToPersianDigits = (num: number) =>
  num.toLocaleString("fa-IR");

interface ProductCardProps {
  product: ProductNode;
  activeRegion?: string;
}

export default function ProductCard({ product, activeRegion }: ProductCardProps) {
  const category = product.productCategories?.nodes?.[0];
  const categorySlug = category?.slug || "uncategorized";
  const categoryName = category?.name || "بدون دسته";
  const categoryLogo = category?.image?.sourceUrl;

  const { currentMinPrice, regularMinPrice } = (() => {
    const variations = product.variationCards || [];
    
    if (activeRegion && variations.length > 0) {
      const filteredVars = variations.filter(v => 
        v.attributes?.some(attr => {
          const cleanName = attr.name.replace('pa_', '').replace('attribute_', '').toLowerCase();
          const isRegionAttr = cleanName.includes('region') || cleanName.includes('ریجن');
          if (!isRegionAttr) return false;

          const valLower = attr.value.toLowerCase();
          const regionLower = activeRegion.toLowerCase();
          return valLower === regionLower || 
                 (regionLower === 'eu' && (valLower.includes('eu') || valLower.includes('اروپا'))) ||
                 (regionLower === 'us' && (valLower.includes('us') || valLower.includes('آمریکا')));
        })
      );

      if (filteredVars.length > 0) {
        let minPrice = Infinity;
        let minRegular: number | null = null;

        filteredVars.forEach(mv => {
          const prices = [mv.parsedPrice, mv.parsedGiftPrice, mv.parsedCodePrice].filter(
            p => p !== null && p !== undefined && p !== 'disabled'
          ) as number[];
          
          if (prices.length > 0) {
            const cardMin = Math.min(...prices);
            if (cardMin < minPrice) {
              minPrice = cardMin;
              minRegular = mv.regularPrice ? Number(mv.regularPrice) : null;
            }
          }
        });

        if (minPrice !== Infinity) {
          return { currentMinPrice: minPrice, regularMinPrice: minRegular };
        }
      }
    }

    return { currentMinPrice: product.parsedPrice, regularMinPrice: product.parsedRegularPrice };
  })();

  const isActualSale =
    regularMinPrice &&
    currentMinPrice &&
    regularMinPrice > currentMinPrice;

  const badges = [];
  const productDate = product.date ? new Date(product.date).getTime() : 0;
  const now = Date.now();
  const isNew = productDate > 0 && now - productDate < 15 * 24 * 60 * 60 * 1000;

  if (isActualSale) badges.push({ text: "حراج", color: "bg-brand-sabz" });
  if (isNew) badges.push({ text: "جدید", color: "bg-brand-blue" });

  const regionParam = activeRegion ? `?region=${activeRegion}` : "";
  const href = product.defaultEdition
    ? `/${categorySlug}/${product.slug}${regionParam}${regionParam ? '&' : '?'}edition=${encodeURIComponent(product.defaultEdition)}`
    : `/${categorySlug}/${product.slug}${regionParam}`;

  return (
    <Link href={href} className="group relative bg-[#15181f] border border-white/5 overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-brand-blue/40 hover:shadow-[0_0_20px_rgba(0,116,224,0.1)]">
      
      {badges.length > 0 && (
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5" dir="rtl">
          {badges.map((b, i) => (
            <span key={i} className={`${b.color} text-brand-bg text-[10px] font-black px-2.5 py-1 tracking-wider shadow-md`}>
              {b.text}
            </span>
          ))}
        </div>
      )}

      <div className="relative aspect-[16/10] w-full bg-brand-surface overflow-hidden">
        {product.image?.sourceUrl ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.name || "تصویر محصول"}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-brand-surface flex items-center justify-center">
            <span className="text-brand-m_khonsa text-xs">بدون تصویر</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#15181f] via-transparent to-transparent opacity-80" />
      </div>

      <div className="p-4 flex flex-col flex-grow relative z-10 -mt-5">
        <div className="flex items-center gap-2 mb-2.5">
          {categoryLogo && (
            <div className="relative w-4 h-4 overflow-hidden rounded-full shrink-0">
              <Image src={categoryLogo} alt={categoryName} fill className="object-cover opacity-80" />
            </div>
          )}
          <span className="text-[#8e98b0] text-[10px] font-bold tracking-wide truncate max-w-[120px]">
            {categoryName}
          </span>
        </div>

        <h3 className="text-white font-bold text-[14px] md:text-[15px] leading-6 group-hover:text-brand-blue transition-colors line-clamp-2 mb-3 text-right" dir="rtl">
          {product.name}
        </h3>

        <div className="hidden md:block mb-4 border-t border-white/[0.03] pt-3">
          <div className="text-[#8e98b0] text-[11px] leading-5 line-clamp-2 text-right opacity-80" dir="rtl">
            تحویل فوری و تضمین شده در کمترین زمان ممکن!
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex flex-col gap-0.5">
            {currentMinPrice ? (
              <>
                <span className="text-[#8e98b0] text-[11px] font-medium mb-1">شروع قیمت:</span>
                {isActualSale ? (
                  <div className="flex flex-col">
                    <span className="text-[#75dd04] font-bold text-base md:text-[17px] flex items-center gap-1.5">
                      {formatToPersianDigits(currentMinPrice)}
                      <span className="text-[12px] font-normal text-white">تومان</span>
                    </span>
                    <del className="text-[#8e98b0] text-[12px] opacity-70 mt-0.5 inline-block w-fit">
                      {formatToPersianDigits(regularMinPrice!)}
                    </del>
                  </div>
                ) : (
                  <span className="text-white font-bold text-base md:text-[17px] flex items-center gap-1.5">
                    {formatToPersianDigits(currentMinPrice)}
                    <span className="text-[12px] font-normal text-[#8e98b0]\">تومان</span>
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#ff4e4e] font-bold text-sm md:text-[15px]">ناموجود</span>
            )}
          </div>

          <div className="w-8 h-8 rounded-sm bg-brand-surface border border-white/5 flex items-center justify-center text-brand-m_khonsa group-hover:bg-brand-blue group-hover:text-brand-bg group-hover:border-brand-blue transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </div>

      </div>
    </Link>
  );
}