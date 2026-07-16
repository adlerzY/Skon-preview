import { computeLevel } from "@/lib/gamification";
import { Trophy } from "lucide-react";

interface XPLevelCardProps {
  successfulOrdersCount: number;
  reviewsCount: number;
}

export default function XPLevelCard({ successfulOrdersCount, reviewsCount }: XPLevelCardProps) {
  const level = computeLevel({ successfulOrdersCount, reviewsCount });

  return (
    <div className="bg-brand-surface border border-brand-surface_hover p-5 flex flex-col gap-3 justify-center">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-full bg-brand-zard/10 text-brand-zard flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white">سطح {level.level.toLocaleString("fa-IR")} — {level.title}</span>
            <span className="text-[11px] text-brand-m_khonsa">
              {successfulOrdersCount.toLocaleString("fa-IR")} سفارش موفق و {reviewsCount.toLocaleString("fa-IR")} دیدگاه
            </span>
          </div>
        </div>
        {level.xpForNextLevel !== null && (
          <span className="text-[11px] text-brand-m_khonsa whitespace-nowrap">
            {(level.xpForNextLevel - level.currentXp).toLocaleString("fa-IR")} امتیاز تا سطح بعد
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