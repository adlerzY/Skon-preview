"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import BlogPostCard from "./BlogPostCard";
import FilterTabs from "@/components/ui/FilterTabs";
import { useBlogPosts } from "./hooks/seBlogPosts";

interface PageInfo { hasNextPage: boolean; endCursor: string | null; }
interface SubCategory { databaseId: number; name: string; slug: string; }

export default function BlogCategoryArchiveClient({
  region,
  mainCategorySlug,
  subCategories,
  initialSelectedSlug,
  initialPosts,
  initialPageInfo,
}: {
  region: string;
  mainCategorySlug: string;
  subCategories: SubCategory[];
  initialSelectedSlug: string;
  initialPosts: any[];
  initialPageInfo: PageInfo;
}) {
  const [selected, setSelected] = useState(initialSelectedSlug);

  const options = [
    { value: "all", label: "همه" },
    ...subCategories.map((s) => ({ value: s.slug, label: s.name })),
  ];

  const buildParams = useCallback(
    (after?: string) => {
      const catSlugs = selected === "all" ? [mainCategorySlug, ...subCategories.map((s) => s.slug)] : [selected];
      const params = new URLSearchParams();
      params.set("catSlugs", catSlugs.join(","));
      if (after) params.set("after", after);
      return params;
    },
    [selected, mainCategorySlug, subCategories]
  );

  const { posts, pageInfo, isLoading, refetch, loadMore } = useBlogPosts({
    initialPosts,
    initialPageInfo,
    buildParams,
  });

  useEffect(() => {
    refetch();
  }, [selected, refetch]);

  return (
    <div className="flex flex-col gap-6">
      {subCategories.length > 0 && <FilterTabs options={options} value={selected} onChange={setSelected} />}

      {isLoading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-14 text-brand-m_khonsa gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> در حال بارگذاری...
        </div>
      ) : posts.length === 0 ? (
        <p className="text-brand-m_khonsa py-8 text-center">هنوز مقاله‌ای در این بخش منتشر نشده است.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} region={region} />
          ))}
        </div>
      )}

      {pageInfo.hasNextPage && (
        <button
          type="button"
          onClick={loadMore}
          disabled={isLoading}
          className="self-center bg-brand-surface hover:bg-brand-surface_hover border border-white/5 text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          مقالات بیشتر
        </button>
      )}
    </div>
  );
}