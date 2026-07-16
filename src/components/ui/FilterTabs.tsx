"use client";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function FilterTabs({ options, value, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-2 text-xs font-bold border transition-colors whitespace-nowrap ${
              active
                ? "bg-brand-blue border-brand-blue text-white"
                : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:text-white hover:border-brand-surface_m"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}