import { computeLevel } from "@/lib/gamification";
import { Trophy } from "lucide-react";

export default function XPLevelCard({ successfulOrdersCount }: { successfulOrdersCount: number }) {
  const level = computeLevel(successfulOrdersCount);

  return (
    <div className="bg-brand-surface border border-brand-surface_hover p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-full bg-brand-zard/10 text-brand-zard flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white">سطح {level.level.toLocaleString("fa-IR")} — {level.title}</span>
            <span className="text-[11px] text-brand-m_khonsa">
              {level.currentCount.toLocaleString("fa-IR")} سفارش موفق
            </span>
          </div>
        </div>
        {level.countForNextLevel !== null && (
          <span className="text-[11px] text-brand-m_khonsa whitespace-nowrap">
            {(level.countForNextLevel - level.currentCount).toLocaleString("fa-IR")} سفارش تا سطح بعد
          </span>
        )}
      </div>
      <div className="w-full h-2 bg-brand-bg overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-brand-zard to-brand-blue transition-all duration-700"
          style={{ width: `${level.progressPercent}%` }}
        />
      </div>
    </div>
  );
}