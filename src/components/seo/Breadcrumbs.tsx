import Link from "next/link";
import { Home } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  const home = items[0];
  const rest = items.slice(1);

  return (
    <nav aria-label="مسیر صفحه" className="mb-5 flex min-w-0 flex-wrap items-center gap-2 text-[11px] text-brand-m_khonsa">
      {home.href && (
        <Link
          href={home.href}
          prefetch={false}
          aria-label="صفحه اصلی"
          className="flex h-7 w-7 items-center justify-center text-brand-m_khonsa transition-colors hover:text-white"
        >
          <Home size={15} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      )}

      {rest.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
          <span className="text-white/20" aria-hidden="true">/</span>
          {item.href && index < rest.length - 1 ? (
            <Link href={item.href} prefetch={false} className="max-w-[42vw] truncate transition-colors hover:text-white">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="max-w-[58vw] truncate text-white/60">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
