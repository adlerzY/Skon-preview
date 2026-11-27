import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function SupportFAQ({ items }: { items: FAQItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <details key={index} open={index === 0} className="group bg-brand-surface border border-brand-surface_hover">
          <summary className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-right cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="font-bold text-sm text-white">{item.question}</span>
            <ChevronDown
              size={16}
              className="text-brand-m_khonsa shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-brand-m_khonsa leading-7">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}