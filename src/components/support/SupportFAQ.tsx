"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function SupportFAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="bg-brand-surface border border-brand-surface_hover">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-right"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-sm text-white">{item.question}</span>
              <ChevronDown size={16} className={`text-brand-m_khonsa shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-brand-m_khonsa leading-7">{item.answer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}