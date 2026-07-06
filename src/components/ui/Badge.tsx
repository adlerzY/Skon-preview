type BadgeTone = "blue" | "sabz" | "zard" | "red" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  blue: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  sabz: "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20",
  zard: "text-brand-zard bg-brand-zard/10 border-brand-zard/20",
  red: "text-red-500 bg-red-500/10 border-red-500/20",
  neutral: "text-brand-m_khonsa bg-brand-surface_hover/40 border-brand-surface_hover",
};

export default function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 border ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}