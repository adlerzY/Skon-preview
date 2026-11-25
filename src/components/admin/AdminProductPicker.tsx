"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { AdminButton, AdminField, AdminSelect } from "./AdminUi";

export interface ProductPickerValue {
  productId: string;
  variationId: string;
}

interface ProductHit {
  databaseId: number;
  name: string;
  variationCount: number;
  codeAvailable: number;
}

interface VariationOption {
  databaseId: number;
  name: string;
  status: string;
  codeAvailable: number;
}

async function fetchProduct(id: number) {
  const response = await fetch(`/api/admin/products/${id}`, { cache: "no-store" });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.product) throw new Error(json?.error || "محصول یافت نشد");
  return {
    product: { databaseId: Number(json.product.databaseId), name: String(json.product.name) },
    variations: (Array.isArray(json.variations) ? json.variations : []) as VariationOption[],
  };
}

export default function AdminProductPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: ProductPickerValue;
  onChange: (next: ProductPickerValue) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<{ databaseId: number; name: string } | null>(null);
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState("");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ search: term, first: "8", status: "publish" });
        const response = await fetch(`/api/admin/products?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const json = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (response.ok) {
          setHits(Array.isArray(json?.nodes) ? json.nodes : []);
          setError("");
        } else {
          setHits([]);
          setError(json?.error || "خطا در جست‌وجو");
        }
      } catch (caught) {
        if ((caught as Error)?.name !== "AbortError") setError("خطا در ارتباط با سرور");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const id = Number(value.productId);
    if (!Number.isInteger(id) || id <= 0) {
      setProduct(null);
      setVariations([]);
      return;
    }

    let active = true;
    setLoadingProduct(true);
    setError("");

    fetchProduct(id)
      .then((result) => {
        if (!active) return;
        setProduct(result.product);
        setVariations(result.variations);
        if (!value.variationId && result.variations.length === 1) {
          onChangeRef.current({ productId: value.productId, variationId: String(result.variations[0].databaseId) });
        }
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "خطا در دریافت محصول");
      })
      .finally(() => {
        if (active) setLoadingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [value.productId]);

  const clear = () => {
    setQuery("");
    setHits([]);
    setError("");
    onChange({ productId: "", variationId: "" });
  };

  const hasProduct = Number(value.productId) > 0;

  if (hasProduct) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-[5px] border border-brand-surface_hover bg-brand-bg p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">
              {loadingProduct && !product ? "در حال بارگذاری..." : product?.name ?? `محصول #${value.productId}`}
            </div>
            <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">#{value.productId}</div>
          </div>
          <AdminButton onClick={clear} disabled={disabled} className="min-h-9 px-3 text-xs">
            <X size={13} /> تغییر
          </AdminButton>
        </div>

        {variations.length > 0 ? (
          <AdminSelect
            value={value.variationId}
            disabled={disabled}
            onChange={(event) => onChange({ productId: value.productId, variationId: event.target.value })}
          >
            <option value="">انتخاب تنوع</option>
            {variations.map((variation) => (
              <option key={variation.databaseId} value={variation.databaseId}>
                {variation.name || `#${variation.databaseId}`} · موجود: {variation.codeAvailable.toLocaleString("fa-IR")}
                {variation.status !== "publish" ? " (غیرفعال)" : ""}
              </option>
            ))}
          </AdminSelect>
        ) : (
          !loadingProduct && <div className="text-xs text-brand-zard">این محصول تنوعی ندارد؛ CD Key فقط برای تنوع‌ها قابل ثبت است.</div>
        )}

        {error && <div className="text-xs text-red-300">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-m_khonsa" />
        <AdminField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="نام محصول یا #شناسه را جست‌وجو کنید"
          disabled={disabled}
          className="pr-9"
        />
      </div>

      {searching && <div className="text-xs text-brand-m_khonsa">در حال جست‌وجو...</div>}
      {error && <div className="text-xs text-red-300">{error}</div>}

      {hits.length > 0 && (
        <div className="overflow-hidden rounded-[5px] border border-brand-surface_hover bg-brand-bg">
          {hits.map((hit) => (
            <button
              key={hit.databaseId}
              type="button"
              onClick={() => onChange({ productId: String(hit.databaseId), variationId: "" })}
              className="flex w-full items-center justify-between gap-3 border-b border-brand-surface_hover px-3 py-2.5 text-right text-sm text-white transition-colors last:border-0 hover:bg-white/[.04]"
            >
              <span className="min-w-0 truncate font-bold">{hit.name}</span>
              <span className="shrink-0 text-xs text-brand-m_khonsa">
                {hit.variationCount.toLocaleString("fa-IR")} تنوع · #{hit.databaseId}
              </span>
            </button>
          ))}
        </div>
      )}

      {!searching && query.trim().length >= 2 && hits.length === 0 && !error && (
        <div className="text-xs text-brand-m_khonsa">محصولی پیدا نشد.</div>
      )}
    </div>
  );
}