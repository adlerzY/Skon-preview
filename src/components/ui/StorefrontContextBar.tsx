import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface StorefrontContextBarProps {
  subcategories?: SubcategoryItem[];
  categoryLabel?: string;
}

const MAX_VISIBLE_SUBCATEGORIES = 6;

export default function StorefrontContextBar({
  subcategories = [],
  categoryLabel,
}: StorefrontContextBarProps) {
  if (!categoryLabel && subcategories.length === 0) return null;

  const visibleSubcategories = subcategories.slice(0, MAX_VISIBLE_SUBCATEGORIES);
  const hiddenSubcategories = subcategories.slice(MAX_VISIBLE_SUBCATEGORIES);

  return (
    <nav
      aria-label="دسته‌بندی‌های فروشگاه"
      className="w-full border-b border-brand-surface_hover"
      dir="rtl"
    >
      <div className="flex min-h-[58px] w-full items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto scrollbar-hide">
          {categoryLabel && (
            <span className="flex shrink-0 items-center gap-2 whitespace-nowrap py-4 text-[14px] font-bold text-brand-white">
              {categoryLabel}
            </span>
          )}

          {visibleSubcategories.map((subcategory) => (
            <Link
              key={subcategory.id}
              href={`#subcat-${subcategory.slug}`}
              className="shrink-0 whitespace-nowrap py-4 text-[14px] font-bold text-brand-m_khonsa transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              {subcategory.name}
            </Link>
          ))}
        </div>

        {hiddenSubcategories.length > 0 && (
          <details className="group relative shrink-0 self-stretch">
            <summary className="flex h-full cursor-pointer list-none items-center gap-1 whitespace-nowrap py-4 text-[14px] font-bold text-brand-m_khonsa transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
              <span>بیشتر</span>
              <ChevronDown size={15} strokeWidth={2.4} aria-hidden="true" />
            </summary>

            <div className="absolute right-0 top-full z-[60] min-w-[230px] border border-brand-surface_hover bg-brand-surface p-2 shadow-[0_16px_36px_rgba(0,0,0,0.38)]">
              <div className="flex flex-col">
                {hiddenSubcategories.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    href={`#subcat-${subcategory.slug}`}
                    className="px-3 py-2.5 text-[13px] font-semibold text-brand-m_khonsa transition-colors hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:text-white focus-visible:outline-none"
                  >
                    {subcategory.name}
                  </Link>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </nav>
  );
}
