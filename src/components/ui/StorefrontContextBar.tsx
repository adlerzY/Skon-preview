import Link from "next/link";
import { Home } from "lucide-react";
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
        <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 scrollbar-hide" aria-label="زیر دسته‌ها">
          {subcategories.map((subcategory) => (
            <a
              key={subcategory.id}
              href={`#subcat-${subcategory.slug}`}
              className="shrink-0 border-b-2 border-transparent px-3.5 py-2 text-[12px] font-bold text-brand-m_khonsa transition-colors hover:border-brand-blue hover:text-white"
            >
              {subcategory.name}
            </a>
          ))}
        </nav>
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-white">
            <Link
              href={`/${region}`}
              prefetch={false}
              aria-label="صفحه اصلی"
              className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-m_khonsa transition-colors hover:text-white"
            >
              <Home size={15} aria-hidden="true" />
            </Link>
            <span className="truncate text-brand-m_khonsa">{categoryLabel}</span>
          </div>
        </div>
      )}
    </StorefrontContextBarClient>
  );
}
