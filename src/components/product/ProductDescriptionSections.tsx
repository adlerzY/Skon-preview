import Image from "next/image";

interface SecondaryGalleryItem {
  description?: string;
  imageUrl?: string;
}

export default function ProductDescriptionSections({
  secondaryGallery,
  description,
}: {
  secondaryGallery?: SecondaryGalleryItem[] | null;
  description?: string;
}) {
  return (
    <>
      {(secondaryGallery?.length ?? 0) > 0 && (
        <div className="w-full border-t border-brand-surface_hover pt-5 flex flex-col gap-3">
          <h2 className="text-xl font-black text-brand-active border-r-4 border-brand-blue pr-3">آیتم‌های محصول</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {secondaryGallery!.map((item, index) => (
              <div key={index} className="bg-brand-menu border border-brand-surface_hover flex flex-col overflow-hidden shadow-md">
                {item.imageUrl && (
                  <div className="relative w-full aspect-[16/9] bg-brand-surface">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      quality={85}
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                )}
                {item.description && (
                  <div
                    className="prose prose-compact max-w-none px-3.5 py-3 text-brand-m_khonsa"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {description && (
        <div className="w-full border-t border-brand-surface_hover pt-5 flex flex-col gap-3">
          <h2 className="text-xl font-black text-brand-active border-r-4 border-brand-blue pr-3">توضیحات تکمیلی محصول</h2>
          <div
            className="prose prose-compact max-w-none bg-brand-menu px-5 py-4 border border-brand-surface_hover text-brand-m_khonsa"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}
    </>
  );
}
