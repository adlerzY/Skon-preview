import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="مسیر صفحه" className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-brand-m_khonsa">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span className="text-white/20" aria-hidden="true">/</span>}
          {item.href && index < items.length - 1 ? (
            <Link href={item.href} prefetch={false} className="transition-colors hover:text-white">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-white/60">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
