"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_THRESHOLD_PX = 480;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SHOW_THRESHOLD_PX);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="بازگشت به بالای صفحه"
      className={`fixed left-4 md:left-6 bottom-[calc(58px+env(safe-area-inset-bottom)+16px)] lg:bottom-6 z-[9990] w-11 h-11 rounded-full bg-brand-blue text-white shadow-[0_10px_25px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 hover:bg-[#0062d1] ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
}