import React from "react";
import { getProductDetail } from "@/lib/wp-graphql";
import Image from "next/image";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: {
    categorySlug: string;
    productSlug: string;
  };
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { productSlug } = params;

  // ۱. دریافت اطلاعات محصول از وردپرس
  const product = await getProductDetail(productSlug);

  // ۲. اگر محصول وجود نداشت یا اشتباه بود، ۴۰۴ بده
  if (!product) {
    notFound();
  }

  // استخراج فیلدهای مورد نیاز
  const { name, image, description, shortDescription, parsedPrice, parsedRegularPrice, galleryImages, attributes } = product;
  const gallery = galleryImages?.nodes || [];

  return (
    <main className="container mx-auto px-6 max-w-[1600px] py-10 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#15171e]/60 border border-white/5 p-6 md:p-8 rounded-2xl backdrop-blur-xl">
        
        {/* بخش تصاویر محصول (سمت راست در دسکتاپ) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#1c1e25] border border-white/5">
            <Image
              src={image?.sourceUrl || "/placeholder-product.jpg"}
              alt={name}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* گالری تصاویر کوچک (اگر وجود داشته باشه) */}
          {gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((img: any, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-[#1c1e25] border border-white/5 cursor-pointer hover:border-brand-blue duration-150">
                  <Image src={img.sourceUrl} alt={`${name}-${idx}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* بخش اطلاعات و خرید محصول (سمت چپ در دسکتاپ) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-4">{name}</h1>
            
            {/* توضیحات کوتاه */}
            {shortDescription && (
              <div 
                className="text-gray-400 text-sm leading-relaxed mb-6 border-b border-white/5 pb-6"
                dangerouslySetInnerHTML={{ __html: shortDescription }}
              />
            )}

            {/* ویژگی‌های محصول (Attributes) مثل سرور، ریجن و... */}
            {attributes?.nodes && attributes.nodes.length > 0 && (
              <div className="flex flex-col gap-3 mb-6">
                {attributes.nodes.map((attr: any, idx: number) => (
                  <div key={idx} className="flex gap-2 text-sm bg-[#1c1e25] p-3 rounded-lg border border-white/5">
                    <span className="text-brand-blue font-bold">{attr.name}:</span>
                    <span className="text-gray-300">{attr.options?.join("، ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* باکس قیمت و دکمه خرید */}
          <div className="bg-[#1c1e25] p-6 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">قیمت محصول:</span>
              <div className="flex items-center gap-2">
                {parsedRegularPrice && parsedRegularPrice > parsedPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {parsedRegularPrice.toLocaleString("fa-IR")} تومان
                  </span>
                )}
                <span className="text-xl md:text-2xl font-black text-brand-blue">
                  {parsedPrice ? `${parsedPrice.toLocaleString("fa-IR")} تومان` : "تماس بگیرید"}
                </span>
              </div>
            </div>

            <button className="bg-brand-blue hover:bg-[#0062d1] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-brand-blue/20 transition-all duration-150 active:scale-[0.98]">
              افزودن به سبد خرید
            </button>
          </div>

        </div>
      </div>

      {/* توضیحات تکمیلی محصول در پایین */}
      {description && (
        <section className="mt-8 bg-[#15171e]/60 border border-white/5 p-6 md:p-8 rounded-2xl backdrop-blur-xl">
          <h2 className="text-lg font-bold text-gray-400 mb-4 border-b border-white/5 pb-2">توضیحات کامل</h2>
          <div 
            className="text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </section>
      )}
    </main>
  );
}