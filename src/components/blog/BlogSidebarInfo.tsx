import { List } from "lucide-react";
import BlogRating from "./BlogRating";
import type { TocItem } from "@/lib/blogToc";

export default function BlogSidebarInfo({
  postId,
  averageRating,
  ratingCount,
  toc,
}: {
  postId: number;
  averageRating: number;
  ratingCount: number;
  toc: TocItem[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-brand-surface border border-brand-surface_hover p-5">
        <BlogRating postId={postId} initialAverage={averageRating} initialCount={ratingCount} />
      </div>

      {toc.length > 0 && (
        <details className="bg-brand-surface border border-brand-surface_hover open:pb-2 lg:open" open>
          <summary className="flex items-center gap-2 p-4 text-sm font-bold text-white cursor-pointer select-none lg:cursor-default">
            <List size={16} className="text-brand-blue" />
            فهرست مطالب
          </summary>
          <nav className="flex flex-col gap-0.5 px-4 pb-4">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`text-xs py-1.5 text-brand-m_khonsa hover:text-brand-blue transition-colors border-r-2 border-transparent hover:border-brand-blue ${
                  item.level === 3 ? "pr-5" : "pr-3"
                }`}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </details>
      )}
    </div>
  );
}