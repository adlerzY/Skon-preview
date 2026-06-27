// SubcategoryMenu.tsx
"use client";

import Button from "@/components/ui/Button";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryMenuProps {
  subcategories: Subcategory[];
}

export default function SubcategoryMenu({ subcategories }: SubcategoryMenuProps) {
  if (!subcategories || subcategories.length === 0) return null;

  const handleScroll = (slug: string) => {
    const element = document.getElementById(`subcat-${slug}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="sticky top-20 z-40 w-full bg-brand-bg border-b border-brand-white/5 pb-2.5 my-6 rounded-none overflow-x-auto no-scrollbar">
      <div className="container mx-auto flex gap-2 items-center min-w-max">
        {subcategories.map((sub) => (
          <Button
            key={sub.id}
            onClick={() => handleScroll(sub.slug)}
            className="px-5 py-2.5 bg-brand-surface hover:bg-brand-surface_hover text-brand-white border border-white/5 text-sm font-medium whitespace-nowrap"
          >
            {sub.name}
          </Button>
        ))}
      </div>
    </div>
  );
}