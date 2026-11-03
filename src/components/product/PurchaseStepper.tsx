import { Check } from "lucide-react";

export interface StepperItem {
  id: string;
  label: string;
  status: "done" | "active" | "upcoming";
  clickable: boolean;
}

interface PurchaseStepperProps {
  items: readonly StepperItem[];
  onSelect: (id: string) => void;
}

export default function PurchaseStepper({ items, onSelect }: PurchaseStepperProps) {
  return (
    <nav aria-label="مراحل خرید" dir="rtl" className="w-full">
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item, index) => {
          const isActive = item.status === "active";
          const isDone = item.status === "done";
          const lit = index > 0 && item.status !== "upcoming";

          const circleClass = isActive
            ? "border-brand-blue bg-brand-blue text-white shadow-[0_0_0_3px_rgba(0,116,224,0.16)]"
            : isDone
            ? "border-brand-sabz bg-brand-sabz text-brand-bg"
            : "border-brand-surface_hover bg-brand-bg text-brand-surface_m";

          const labelClass = isActive ? "text-white" : isDone ? "text-brand-m_khonsa" : "text-brand-surface_m";

          const content = (
            <>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-black transition-colors duration-200 ${circleClass}`}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : (index + 1).toLocaleString("fa-IR")}
              </span>
              <span
                className={`mt-1.5 px-1 text-center text-[11px] font-bold leading-5 transition-colors duration-200 ${labelClass}`}
              >
                {item.label}
              </span>
            </>
          );

          return (
            <li key={item.id} aria-current={isActive ? "step" : undefined} className="relative flex justify-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-[13px] h-[2px] w-full transition-colors duration-200 ${
                    lit ? "bg-brand-blue" : "bg-brand-surface_hover"
                  }`}
                />
              )}
              {item.clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="relative z-10 flex w-full cursor-pointer flex-col items-center focus-visible:outline-none"
                >
                  {content}
                </button>
              ) : (
                <div className="relative z-10 flex w-full flex-col items-center">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}