import { useState, useEffect, useTransition } from "react";
import { searchProductsByKeyword } from "@/actions/search";

export function useProductSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // ✅ یه effect واحد با debounce داخلی — بدون state میانی اضافه
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchProductsByKeyword(searchQuery);
        if (!cancelled) {
          setSearchResults(results);
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isPending,
  };
}
