"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
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
import { useAdminList, type AdminListData } from "./useAdminList";
import { faNumber } from "./format";

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

const STATUS_LABEL: Record<string, string> = {
  publish: "منتشرشده",
  draft: "پیش‌نویس",
  private: "خصوصی",
  pending: "در انتظار بررسی",
};

const statusTone = (status: string): "success" | "neutral" | "warning" =>
  status === "publish" ? "success" : status === "pending" ? "warning" : "neutral";

function CodeStock({ available, reserved }: { available: number; reserved: number }) {
  if (available === 0 && reserved === 0) return <span className="text-xs text-brand-m_khonsa">—</span>;
  const tone = available === 0 ? "danger" : available <= 5 ? "warning" : "success";
  return (
    <span className="inline-flex items-center gap-2">
      <AdminBadge tone={tone}>{faNumber(available)} موجود</AdminBadge>
      {reserved > 0 && <span className="text-xs text-brand-m_khonsa">{faNumber(reserved)} رزرو</span>}
    </span>
  );
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-brand-surface_hover bg-brand-bg">
      {src ? <img src={src} alt={alt} width={40} height={40} loading="lazy" className="h-full w-full object-cover" /> : null}
    </span>
  );
}

export default function AdminProductsClient({ initial }: { initial?: ProductsData }) {
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
        eyebrow="کاتالوگ"
        title="محصولات"
        description="وضعیت محصولات، تنوع‌ها و موجودی کد را ببین. قیمت‌ها فقط از موتور قیمت‌گذاری می‌آیند و اینجا قابل ویرایش نیستند."
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
        <AdminSelect value={sortKey} onChange={(event) => setSortKey(event.target.value)} className="lg:w-[200px] lg:flex-none">
          <option value="date:desc">جدیدترین</option>
          <option value="date:asc">قدیمی‌ترین</option>
          <option value="title:asc">نام (الف تا ی)</option>
          <option value="title:desc">نام (ی تا الف)</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="محصولی با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="980px">
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
                <tr key={product.databaseId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Thumb src={product.imageUrl} alt={product.name} />
                      <div className="min-w-0">
                        <div className="max-w-[360px] truncate text-sm font-black text-white">{product.name}</div>
                        <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">#{product.databaseId} · {product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <AdminBadge tone={statusTone(product.status)}>{STATUS_LABEL[product.status] ?? product.status}</AdminBadge>
                  </td>
                  <td className="text-sm text-white">{faNumber(product.variationCount)}</td>
                  <td>
                    <CodeStock available={product.codeAvailable} reserved={product.codeReserved} />
                  </td>
                  <td>
                    <Link
                      href={`/admin/products/${product.databaseId}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 text-xs font-black text-brand-blue hover:text-white"
                    >
                      <Eye size={14} /> جزئیات
                    </Link>
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
                    <div className="truncate text-sm font-black text-white">{product.name}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa">#{product.databaseId}</div>
                  </div>
                  <AdminBadge tone={statusTone(product.status)}>{STATUS_LABEL[product.status] ?? product.status}</AdminBadge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-brand-m_khonsa">{faNumber(product.variationCount)} تنوع</span>
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