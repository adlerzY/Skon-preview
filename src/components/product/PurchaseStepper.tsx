import { Check } from "lucide-react";

export type PurchaseStep = 1 | 2 | 3;

export const PURCHASE_STEP_LABELS = [
  "انتخاب نسخه و مشخصات",
  "انتخاب روش تحویل",
  "تکمیل اطلاعات و ثبت سفارش",
] as const;

interface PurchaseStepperProps {
  active: PurchaseStep;
  completed?: readonly boolean[];
  selectable?: readonly boolean[];
  onSelect?: (step: PurchaseStep) => void;
}

export default function PurchaseStepper({
  active,
  completed = [],
  selectable = [],
  onSelect,
}: PurchaseStepperProps) {
  return (
    <nav aria-label="مراحل خرید" className="w-full">
      <ol className="grid grid-cols-3">
        {PURCHASE_STEP_LABELS.map((label, index) => {
          const step = (index + 1) as PurchaseStep;
          const isActive = active === step;
          const isDone = !isActive && Boolean(completed[index]);
          const lineActive = index > 0 && (active >= step || Boolean(completed[index - 1]));
          const clickable = Boolean(onSelect) && Boolean(selectable[index]) && !isActive;

          const circleClass = isActive
            ? "border-brand-blue bg-brand-blue text-white shadow-[0_0_0_4px_rgba(0,116,224,0.18)]"
            : isDone
            ? "border-brand-sabz bg-brand-sabz text-brand-bg"
            : "border-brand-surface_hover bg-brand-bg text-brand-surface_m";

          const labelClass = isActive
            ? "text-white"
            : isDone
            ? "text-brand-m_khonsa"
            : "text-brand-surface_m";

          const content = (
            <>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black transition-colors duration-200 ${circleClass}`}
              >
                {isDone ? <Check size={15} strokeWidth={3} /> : step.toLocaleString("fa-IR")}
              </span>
              <span
                className={`mt-2 px-1 text-center text-[11px] font-bold leading-5 transition-colors duration-200 ${labelClass}`}
              >
                {label}
              </span>
            </>
          );

          return (
            <li key={label} aria-current={isActive ? "step" : undefined} className="relative flex justify-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-[15px] h-[2px] w-full transition-colors duration-200 ${
                    lineActive ? "bg-brand-blue" : "bg-brand-surface_hover"
                  }`}
                />
              )}
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(step)}
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