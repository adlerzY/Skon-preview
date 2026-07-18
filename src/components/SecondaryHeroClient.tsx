"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import type { HeroTabItem } from "@/lib/graphql";

interface SecondaryHeroClientProps {
  sectionTitle: string;
  tabs: HeroTabItem[];
}

export default function SecondaryHeroClient({ sectionTitle, tabs }: SecondaryHeroClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % tabs.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + tabs.length) % tabs.length);
  };

  return (
    <div className="w-full bg-[#111215] border border-white/5 overflow-hidden" dir="rtl">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 md:px-10 pt-6 pb-2 border-b border-white/5 gap-4">
        <h2 className="text-lg md:text-xl font-black text-white shrink-0">{sectionTitle}</h2>

        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 whitespace-nowrap pb-3 text-sm font-bold border-b-[3px] transition-colors ${
                index === activeIndex
                  ? "border-brand-blue text-white"
                  : "border-transparent text-brand-m_khonsa hover:text-white"
              }`}
            >
              {tab.tabLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch relative min-h-[360px] lg:h-[440px]">
        
        <div 
          key={`text-${activeIndex}`} 
          className="lg:col-span-6 flex flex-col justify-center items-start gap-4 p-8 md:p-12 lg:pr-16 animate-in fade-in duration-500 z-10 order-1 lg:order-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-black text-xl">D</span>
            <h3 className="text-lg md:text-xl font-black text-white leading-snug">{activeTab.heading}</h3>
          </div>
          
          {activeTab.description && (
            <p className="text-sm text-brand-m_khonsa leading-7 max-w-xl text-justify">
              {activeTab.description}
            </p>
          )}
          
          {activeTab.ctaText && activeTab.ctaLink && (
            <div className="mt-4">
              <Button 
                href={activeTab.ctaLink} 
                className="bg-[#2a2c32] hover:bg-[#3f424a] text-white border-transparent px-6 py-2.5 text-xs tracking-wider"
              >
                {activeTab.ctaText}
              </Button>
            </div>
          )}
        </div>

        <div className="absolute inset-y-0 left-0 right-0 hidden lg:flex items-center justify-between px-4 pointer-events-none z-20">
          <button 
            onClick={handleNext}
            className="w-10 h-12 border border-white/10 bg-black/40 hover:bg-black/70 flex items-center justify-center text-white rounded transition-colors pointer-events-auto"
          >
            ➔
          </button>
          <button 
            onClick={handlePrev}
            className="w-10 h-12 border border-white/10 bg-black/40 hover:bg-black/70 flex items-center justify-center text-white rounded transition-colors pointer-events-auto"
          >
            ←
          </button>
        </div>

        <div className="relative lg:col-span-6 h-[240px] lg:h-full w-full bg-[#111215] order-2 lg:order-1">
          <Image
            key={`img-${activeIndex}`}
            src={activeTab.imageUrl || "/images/bi-aksi.webp"}
            alt={activeTab.heading}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={90}
            className="object-cover animate-in fade-in duration-500"
          />
          <div className="hidden lg:block absolute inset-y-0 left-0 w-1/3 bg-gradient-to-l from-transparent to-[#111215]" />
          <div className="block lg:hidden absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#111215] to-transparent" />
        </div>

      </div>
    </div>
  );
}