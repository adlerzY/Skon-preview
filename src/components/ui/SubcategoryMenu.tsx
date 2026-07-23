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

  return (
    <div className="sticky top-16 z-40 w-full bg-[#1c1e25]/80 backdrop-blur-xl border-b border-white/5 py-4 my-6 overflow-x-auto no-scrollbar">
      <div className="container mx-auto px-6 flex gap-4 items-center min-w-max">
        {subcategories.map((sub) => (
          <a
            key={sub.id}
            href={`#subcat-${sub.slug}`}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 text-sm font-medium whitespace-nowrap transition-colors"
          >
            {sub.name}
          </a>
        ))}
      </div>
    </div>
  );
}