import Image from "next/image";
import Link from "next/link";
import { ProductNode } from "@/lib/graphql";

const formatToPersianDigits = (num: number) => {
  return num.toLocaleString("fa-IR");
};

interface ProductCardProps {
  product: ProductNode;
  activeRegion?: string;
}

export default function ProductCard({ product, activeRegion }: ProductCardProps) {
  const category = product.productCategories?.nodes?.[0];
  const categorySlug = category?.slug || "uncategorized";
  const categoryName = category?.name || "بدون دسته";
  const categoryLogo = category?.image?.sourceUrl;

  // منطق پیشرفته محاسبه قیمت بر اساس ریجن فعال
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

  // مدیریت بج‌های محصول
  const badges = [];
  const productDate = product.date ? new Date(product.date).getTime() : 0;
  const now = Date.now();
  const isNew = productDate > 0 && now - productDate < 15 * 24 * 60 * 60 * 1000;

  if (isActualSale) {
    badges.push({ text: "حراج", color: "bg-brand-sabz" });
  }
  if (isNew) {
    badges.push({ text: "جدید", color: "bg-brand-blue" });
  }

  // ساخت لینک پویا با در نظر گرفتن ریجن و ادیشن
  const regionParam = activeRegion ? `?region=${activeRegion}` : "";
  const href = product.defaultEdition
    ? `/${categorySlug}/${product.slug}${regionParam}${regionParam ? '&' : '?'}edition=${encodeURIComponent(product.defaultEdition)}`
    : `/${categorySlug}/${product.slug}${regionParam}`;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-brand-surface duration-200 hover:bg-brand-surface_hover overflow-hidden relative h-full min-h-[340px] md:min-h-[340px]"
    >
      {/* بخش بج‌ها */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
        {badges.map((badge, index) => (
          <span
            key={index}
            className={`${badge.color} text-brand-bg text-[10px] md:text-[13px] font-bold px-3.5 py-1 uppercase tracking-wider`}
          >
            {badge.text}
          </span>
        ))}
      </div>

      {/* تصویر محصول */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#0b0c10] flex-shrink-0">
        {product.image?.sourceUrl ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.name || "تصویر محصول"}
            fill
            className="object-cover transition-all duration-200 ease-in-out brightness-[0.99] group-hover:brightness-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
            بدون تصویر
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#23252b] via-transparent to-transparent opacity-20"></div>
      </div>

      {/* محتوای متنی کارت */}
      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <div className="transform transition-transform duration-200 ease-out group-hover:-translate-y-1">
          {/* لوگو و نام دسته بندی */}
          <div className="flex items-center gap-2 mb-1">
            {categoryLogo && (
              <div className="relative w-5 h-5 opacity-90">
                <Image
                  src={categoryLogo}
                  alt={categoryName}
                  fill
                  className="object-contain"
                  sizes="20px"
                />
              </div>
            )}
            <span className="text-[#8e98b0] text-[12px] font-bold uppercase tracking-wide">
              {categoryName}
            </span>
          </div>

          {/* عنوان محصول */}
          <h3 className="text-[#f3f4f6] font-bold text-base md:text-[17px] transition-colors duration-200 group-hover:text-white line-clamp-2 mb-1">
            {product.name}
          </h3>

          {/* توضیحات کوتاه محصول */}
          <div
            className="text-[#ffb400] text-[13px] mb-1 line-clamp-3 overflow-hidden"
            dangerouslySetInnerHTML={{
              __html: product.shortDescription || "خدمات دیجیتال و درون‌برنامه‌ای",
            }}
          />

          {/* متن ضمانت تحویل */}
          <div className="text-[#8e98b0] text-[10px] font-medium leading-relaxed mb-2 line-clamp-1">
            تحویل آنی و تضمین شده در کمترین زمان ممکن!
          </div>
        </div>

        {/* بخش قیمت نهایی (فوتر کارت) */}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex flex-col gap-0.5">
            {currentMinPrice ? (
              <>
                <span className="text-[#8e98b0] text-[11px] font-medium mb-1">
                  شروع قیمت:
                </span>
                
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
                    <span className="text-[12px] font-normal text-[#8e98b0]">تومان</span>
                  </span>
                )}
              </>
            ) : (
              <span className="text-[#ff4e4e] font-bold text-sm md:text-base mt-2">
                ناموجود
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}