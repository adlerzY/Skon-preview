"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  AdminBadge,
  AdminEmpty,
  AdminFilterBar,
  AdminListCard,
  AdminMobileList,
  AdminPage,
  AdminPageIntro,
  AdminRefreshButton,
  AdminSearchInput,
  AdminSelect,
  AdminTable,
} from "./AdminUi";
import { AdminErrorBanner, AdminListCount, AdminLoadMore, AdminSkeletonRows } from "./AdminListParts";
import AdminMoreFilters, { AdminFilterField } from "./AdminMoreFilters";
import { useAdminList, type AdminListData } from "./useAdminList";
import { faNumber } from "./format";
import { PRODUCT_STATUS_LABELS, productStatusTone } from "./labels";

interface ProductRow {
  databaseId: number;
  name: string;
  slug: string;
  status: string;
  imageUrl: string | null;
  variationCount: number;
  codeAvailable: number;
  codeReserved: number;
  editUrl: string | null;
}

type ProductsData = AdminListData<ProductRow>;

function CodeStock({ available, reserved }: { available: number; reserved: number }) {
  if (available === 0 && reserved === 0) return <span className="text-[13px] text-brand-m_khonsa">—</span>;
  const tone = available === 0 ? "danger" : available <= 5 ? "warning" : "success";
  return (
    <span className="inline-flex items-center gap-2">
      <AdminBadge tone={tone}>{faNumber(available)} موجود</AdminBadge>
      {reserved > 0 ? <span className="text-[12px] text-brand-m_khonsa">{faNumber(reserved)} رزرو</span> : null}
    </span>
  );
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-brand-surface_hover bg-brand-bg">
      {src ? <img src={src} alt={alt} width={40} height={40} loading="lazy" className="h-full w-full object-cover" /> : null}
    </span>
  );
}

export default function AdminProductsClient({ initial }: { initial?: ProductsData }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState("date:desc");
  const params = useMemo(() => {
    const [sort, order] = sortKey.split(":");
    return { search: search.trim(), status, sort, order };
  }, [search, status, sortKey]);

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<ProductsData>({
    endpoint: "/api/admin/products",
    params,
    initial,
  });

  const showSkeleton = loading && data.nodes.length === 0;

  return (
    <AdminPage>
      <AdminPageIntro
        title="محصولات"
        description="وضعیت محصولات، تنوع‌ها و موجودی کد را ببین. قیمت‌ها فقط از موتور قیمت‌گذاری می‌آیند."
        action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />}
      />

      <AdminFilterBar>
        <AdminSearchInput value={search} onChange={setSearch} placeholder="نام محصول یا #شناسه" />
        <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)} className="lg:w-[200px] lg:flex-none">
          <option value="all">همه وضعیت‌ها</option>
          <option value="publish">منتشرشده</option>
          <option value="draft">پیش‌نویس</option>
          <option value="private">خصوصی</option>
          <option value="pending">در انتظار بررسی</option>
        </AdminSelect>
        <AdminMoreFilters activeCount={sortKey !== "date:desc" ? 1 : 0}>
          <AdminFilterField label="مرتب‌سازی">
            <AdminSelect value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
              <option value="date:desc">جدیدترین</option>
              <option value="date:asc">قدیمی‌ترین</option>
              <option value="title:asc">نام (الف تا ی)</option>
              <option value="title:desc">نام (ی تا الف)</option>
            </AdminSelect>
          </AdminFilterField>
        </AdminMoreFilters>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="محصولی با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="780px">
            <thead>
              <tr>
                <th>محصول</th>
                <th>وضعیت</th>
                <th>تنوع‌ها</th>
                <th>موجودی کد</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((product) => (
                <tr
                  key={product.databaseId}
                  onClick={() => router.push(`/admin/products/${product.databaseId}`)}
                  className="cursor-pointer"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <Thumb src={product.imageUrl} alt={product.name} />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.databaseId}`}
                          prefetch={false}
                          onClick={(event) => event.stopPropagation()}
                          className="block max-w-[360px] truncate font-medium text-brand-active hover:text-brand-blue"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-0.5 text-[12px] text-brand-m_khonsa" dir="ltr">
                          #{product.databaseId} · {product.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <AdminBadge tone={productStatusTone(product.status)}>{PRODUCT_STATUS_LABELS[product.status] ?? product.status}</AdminBadge>
                  </td>
                  <td className="text-brand-active">{faNumber(product.variationCount)}</td>
                  <td>
                    <CodeStock available={product.codeAvailable} reserved={product.codeReserved} />
                  </td>
                  <td className="w-8 text-brand-surface_m">
                    <ChevronLeft size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <AdminMobileList>
            {data.nodes.map((product) => (
              <AdminListCard key={product.databaseId} href={`/admin/products/${product.databaseId}`}>
                <div className="flex items-start gap-3">
                  <Thumb src={product.imageUrl} alt={product.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-brand-active">{product.name}</div>
                    <div className="mt-0.5 text-[12px] text-brand-m_khonsa">
                      #{product.databaseId} · {faNumber(product.variationCount)} تنوع
                    </div>
                  </div>
                  <AdminBadge tone={productStatusTone(product.status)}>{PRODUCT_STATUS_LABELS[product.status] ?? product.status}</AdminBadge>
                </div>
                <div className="mt-2 flex justify-end">
                  <CodeStock available={product.codeAvailable} reserved={product.codeReserved} />
                </div>
              </AdminListCard>
            ))}
          </AdminMobileList>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />
    </AdminPage>
  );
}