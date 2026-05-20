import { useState, useEffect, useTransition } from "react";
import { searchProductsByKeyword } from "@/actions/search";

export function useProductSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedQuery("");
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    let ignore = false;

    startTransition(async () => {
      const results = await searchProductsByKeyword(debouncedQuery);
      if (!ignore) {
        setSearchResults(results);
      }
    });

    return () => {
      ignore = true;
    };
  }, [debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isPending,
  };
}