import StorefrontContextBarClient, { type StorefrontActiveGame } from "./StorefrontContextBarClient";

interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface StorefrontContextBarProps {
  region: string;
  subcategories?: SubcategoryItem[];
  categoryLabel?: string;
  activeGame?: StorefrontActiveGame | null;
}

export default function StorefrontContextBar({
  region,
  subcategories = [],
  categoryLabel,
  activeGame,
}: StorefrontContextBarProps) {
  if (!subcategories.length && !categoryLabel && !activeGame) return null;

  return (
    <StorefrontContextBarClient region={region} activeGame={activeGame}>
      {subcategories.length > 0 ? (
        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-3 md:py-4 scrollbar-hide" aria-label="زیر دسته‌ها">
          {subcategories.map((subcategory) => (
            <a
              key={subcategory.id}
              href={`#subcat-${subcategory.slug}`}
              className="shrink-0 px-3.5 py-3.5 md:py-4 text-[13px] font-bold text-brand-m_khonsa transition-colors hover:text-white"
            >
              {subcategory.name}
            </a>
          ))}
        </nav>
      ) : categoryLabel ? (
        <div className="flex min-w-0 flex-1 items-center py-3 md:py-4">
          <span className="truncate text-sm font-bold text-brand-m_khonsa">{categoryLabel}</span>
        </div>
      ) : null}
    </StorefrontContextBarClient>
  );
}
