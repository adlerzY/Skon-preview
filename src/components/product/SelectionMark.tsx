import { Check } from "lucide-react";

type Tone = "blue" | "zard" | "sabz";

const SELECTED_TONES: Record<Tone, string> = {
  blue: "border-brand-blue bg-brand-blue text-white",
  zard: "border-brand-zard bg-brand-zard text-brand-bg",
  sabz: "border-brand-sabz bg-brand-sabz text-brand-bg",
};

export default function SelectionMark({
  selected,
  tone = "blue",
  disabled = false,
}: {
  selected: boolean;
  tone?: Tone;
  disabled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
        selected
          ? SELECTED_TONES[tone]
          : disabled
          ? "border-brand-surface_hover text-transparent"
          : "border-brand-surface_m text-transparent"
      }`}
    >
      <Check
        size={12}
        strokeWidth={3.5}
        className={`transition-all duration-150 ${selected ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
      />
    </span>
  );
}