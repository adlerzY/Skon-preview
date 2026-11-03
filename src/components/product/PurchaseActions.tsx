import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import ConfettiBurst from "@/components/ui/ConfettiBurst";

interface PurchaseActionsProps {
  label: string;
  disabled: boolean;
  onBack?: () => void;
  burstKey: number;
  hint?: string | null;
  notice?: ReactNode;
}

export default function PurchaseActions({ label, disabled, onBack, burstKey, hint, notice }: PurchaseActionsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <ConfettiBurst trigger={burstKey} />
        <button
          type="submit"
          disabled={disabled}
          className={`w-full px-4 py-4 text-sm font-bold leading-5 transition-colors ${
            disabled
              ? "cursor-not-allowed bg-brand-surface_hover text-brand-m_khonsa"
              : "bg-brand-blue text-brand-active hover:bg-[#0062d1]"
          }`}
        >
          {label}
        </button>
      </div>

      {hint && <p className="text-center text-[11px] leading-5 text-brand-surface_m">{hint}</p>}
      {notice}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 self-center px-2 py-1 text-xs font-bold text-brand-m_khonsa transition-colors hover:text-white"
        >
          <ChevronRight size={14} />
          بازگشت
        </button>
      )}
    </div>
  );
}