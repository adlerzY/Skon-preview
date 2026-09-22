"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { ChevronRight, ChevronLeft, Play, Pause } from "lucide-react";

interface Banner {
  secondimage: string;
  subtitle: string;
  link: string;
  imageUrl: string;
}

interface Props {
  banners: Banner[];
  heading?: string;
}

const AUTOPLAY_MS = 5000;
const MOUNT_REST_AFTER_MS = 1500;

export default function CategoryHero({ banners, heading }: Props) {
  const total = banners?.length ?? 0;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mountedCount, setMountedCount] = useState(1);
  const [activeImageLoaded, setActiveImageLoaded] = useState(false);
  const imageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const renderCount = Math.max(mountedCount, activeIndex + 1);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    setActiveImageLoaded(false);
    const image = imageRefs.current[activeIndex];
    if (image?.complete) setActiveImageLoaded(true);
  }, [activeIndex, renderCount]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = window.setTimeout(() => setMountedCount(total), MOUNT_REST_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [total]);

  useEffect(() => {
    setMountedCount((current) => Math.min(total, Math.max(current, activeIndex + 2)));
  }, [activeIndex, total]);

  useEffect(() => {
    if (total <= 1 || !isPlaying) return;
    const interval = setInterval(handleNext, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [isPlaying, total, handleNext]);

  if (!banners || total === 0) {
    return heading ? <div className="sr-only"><h1>{heading}</h1></div> : null;
  }

  const currentBanner = banners[activeIndex];

  return (
    <div dir="rtl" className="w-full max-w-[1600px] mx-auto font-sans group md:px-0">
      <section
        className="relative w-full h-[350px] md:h-[350px] mt-1 bg-brand-bg overflow-hidden"
        aria-busy={!activeImageLoaded}
      >
        <div className="absolute inset-0 bg-[#111215]">
          {banners.slice(0, renderCount).map((banner, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Image
                ref={(node) => { imageRefs.current[index] = node; }}
                src={banner.imageUrl || "/images/bi-aksi.webp"}
                alt={banner.subtitle}
                fill
                preload={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                quality={78}
                sizes="(max-width: 1600px) 100vw, 1600px"
                className={`object-cover object-center transition-opacity duration-300 ${
                  index === activeIndex && activeImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => {
                  if (index === activeIndex) setActiveImageLoaded(true);
                }}
                onError={() => {
                  if (index === activeIndex) setActiveImageLoaded(true);
                }}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111215] via-transparent to-transparent opacity-90 block lg:hidden z-20"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-[#111215] via-[#111215]/80 to-transparent w-full z-20 block lg:hidden"></div>
        </div>

        <div key={activeIndex} className="relative h-full flex flex-col justify-center px-[5.5rem] md:px-[5.5rem] w-full max-w-2xl z-30">
          {heading && (
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3">{heading}</h1>
          )}
          {currentBanner.secondimage && (
            <div className="relative w-48 h-16 md:w-64 md:h-24 mb-2">
              <Image
                src={currentBanner.secondimage}
                alt="Banner Logo"
                fill
                sizes="(max-width: 768px) 192px, 256px"
                quality={70}
                loading="lazy"
                className="object-contain object-right"
              />
            </div>
          )}
          <p className="text-sm text-brand-white mb-4 max-w-lg leading-relaxed line-clamp-2">{currentBanner.subtitle}</p>
          <div className="flex">
            <Button href={currentBanner.link || "#"} variant="primary">
              مشاهده و خرید
            </Button>
          </div>
        </div>

        {total > 1 && (
          <>
            <Button
              variant="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-[80px] z-40"
              onClick={() => { handlePrev(); setIsPlaying(false); }}
              aria-label="قبلی"
            >
              <ChevronRight size={24} strokeWidth={3} />
            </Button>

            <Button
              variant="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-[80px] z-40"
              onClick={() => { handleNext(); setIsPlaying(false); }}
              aria-label="بعدی"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </Button>
          </>
        )}
      </section>

      {total > 1 && (
        <div className="flex items-center justify-center gap-4 mt-3">
          <Button variant="ghost" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? "توقف اسلایدر" : "پخش اسلایدر"}>
            {isPlaying ? <Pause size={18} fill="currentColor" stroke="none" /> : <Play size={18} fill="currentColor" stroke="none" />}
          </Button>

          <div className="flex gap-2 items-center min-w-[115px]" role="tablist" aria-label="اسلایدهای بنر">
            {banners.map((_, index) => (
              <div
                key={index}
                role="tab"
                tabIndex={0}
                aria-selected={index === activeIndex}
                aria-label={`اسلاید ${index + 1}`}
                onClick={() => { setActiveIndex(index); setIsPlaying(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveIndex(index);
                    setIsPlaying(false);
                  }
                }}
                className={`h-[5px] flex-1 rounded-full cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                  index === activeIndex ? "bg-brand-blue " : "bg-brand-surface_m"
                }`}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}