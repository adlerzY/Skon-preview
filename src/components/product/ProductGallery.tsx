"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { collectImages, stripSizeSuffix } from "./imageUtils";
import { MAX_GALLERY_IMAGES } from "./productConstants";
import { useProductMediaActions, useProductMediaState } from "./ProductMediaContext";

const FALLBACK_IMAGE = "/placeholder.jpg";

function GalleryNavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronRight : ChevronLeft;
  const position = direction === "prev" ? "right-4" : "left-4";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`absolute ${position} top-1/2 -translate-y-1/2 z-40 bg-brand-bg text-brand-m_khonsa p-2 border border-brand-surface transition-all opacity-0 group-hover:opacity-100 hover:text-brand-white hover:border-brand-surface_m disabled:!opacity-20 disabled:pointer-events-none`}
      aria-label={direction === "prev" ? "تصویر قبلی" : "تصویر بعدی"}
    >
      <Icon width={20} height={60} strokeWidth={2.5} />
    </button>
  );
}

export default function ProductGallery({
  name,
  baseImages,
}: {
  name: string;
  baseImages: string[];
}) {
  const { selectedImage, variationImages, activeVariationImage } = useProductMediaState();
  const { selectImage } = useProductMediaActions();
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const hasMountedRef = useRef(false);

  const images = useMemo(
    () => collectImages([...baseImages, activeVariationImage, ...variationImages], MAX_GALLERY_IMAGES),
    [baseImages, activeVariationImage, variationImages]
  );

  const displayImage = selectedImage || activeVariationImage || baseImages[0] || FALLBACK_IMAGE;

  const currentIndex = useMemo(() => {
    const key = stripSizeSuffix(displayImage);
    const index = images.findIndex((url) => stripSizeSuffix(url) === key);
    return index === -1 ? 0 : index;
  }, [images, displayImage]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    activeThumbRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 w-full">
      <div className="relative w-full sm:flex-1 aspect-[16/9] bg-brand-surface overflow-hidden border border-brand-surface_hover shadow-lg group">
        <Image
          src={displayImage}
          alt={name}
          fill
          preload={!selectedImage && !activeVariationImage}
          quality={90}
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 58vw"
        />
        {images.length > 1 && (
          <>
            <GalleryNavButton
              direction="prev"
              disabled={currentIndex === 0}
              onClick={() => selectImage(images[currentIndex - 1])}
            />
            <GalleryNavButton
              direction="next"
              disabled={currentIndex === images.length - 1}
              onClick={() => selectImage(images[currentIndex + 1])}
            />
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="w-full sm:w-[96px] lg:w-[108px] shrink-0 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto scrollbar-hide py-1 sm:py-0">
          <div className="flex sm:flex-col gap-2.5 w-max sm:w-full">
            {images.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                ref={index === currentIndex ? activeThumbRef : undefined}
                type="button"
                onClick={() => selectImage(imageUrl)}
                className={`relative w-[86px] sm:w-full aspect-video flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                  index === currentIndex
                    ? "border-brand-blue opacity-100 ring-2 ring-brand-blue/60 shadow-[0_0_12px_rgba(0,116,224,0.3)]"
                    : "border-brand-surface_hover opacity-40 hover:opacity-80"
                }`}
                aria-label={`تصویر ${index + 1}`}
              >
                <Image
                  src={imageUrl}
                  alt={`گالری ${index + 1}`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 86px, 108px"
                  quality={60}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}