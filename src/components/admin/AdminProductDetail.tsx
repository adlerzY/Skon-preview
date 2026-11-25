import Link from "next/link";
import { ArrowRight, ExternalLink, KeyRound } from "lucide-react";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminFieldRow,
  AdminListCard,
  AdminMobileList,
  AdminPage,
  AdminPageIntro,
  AdminSectionHeader,
  AdminStatCard,
  AdminTable,
} from "./AdminUi";
import { faNumber, faPrice } from "./format";

interface ProductInfo {
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

interface VariationInfo {
  databaseId: number;
  name: string;
  region: string | null;
  currency: string | null;
  status: string;
  baseForeignPrice: string | null;
  directPrice: string | null;
  giftPrice: string | null;
  codePrice: string | null;
  codeAvailable: number;
  codeReserved: number;
  codeUsed: number;
}

interface Detail {
  product: ProductInfo;
  variations: VariationInfo[];
  categories: string[];
}

const STATUS_LABEL: Record<string, string> = {
  publish: "منتشرشده",
  draft: "پیش‌نویس",
  private: "خصوصی",
  pending: "در انتظار بررسی",
};

function stockTone(variation: VariationInfo): "success" | "warning" | "danger" | "neutral" {
  if (variation.codePrice == null || variation.codePrice === "disabled") return "neutral";
  if (variation.codeAvailable === 0) return "danger";
  return variation.codeAvailable <= 5 ? "warning" : "success";
}

function keysHref(productId: number, variationId: number) {
  return `/admin/cdkeys?productId=${productId}&variationId=${variationId}`;
}

export default function AdminProductDetail({ data, permissions }: { data: Detail; permissions: string[] }) {
  const { product, variations, categories } = data;
  const canKeys = permissions.includes("cdkeys.write");

  return (
    <AdminPage>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/products" prefetch={false} className="inline-flex items-center gap-2 text-sm font-bold text-brand-m_khonsa hover:text-white">
          <ArrowRight size={15} /> بازگشت به محصولات
        </Link>
        <AdminBadge tone={product.status === "publish" ? "success" : "neutral"}>{STATUS_LABEL[product.status] ?? product.status}</AdminBadge>
      </div>

      <AdminPageIntro
        eyebrow="پرونده محصول"
        title={product.name}
        description={`#${product.databaseId} · ${product.slug}`}
        action={
          <>
            {canKeys && (
              <Link
                href={`/admin/cdkeys?productId=${product.databaseId}`}
                prefetch={false}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] bg-brand-blue px-3.5 text-sm font-bold text-white hover:brightness-110"
              >
                <KeyRound size={14} /> مدیریت CD Key
              </Link>
            )}
            {product.editUrl && (
              <a
                href={product.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] border border-brand-surface_hover px-3.5 text-sm font-bold text-white hover:bg-brand-surface_hover/70"
              >
                <ExternalLink size={14} /> ویرایش در وردپرس
              </a>
            )}
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="تنوع‌ها" value={product.variationCount} />
        <AdminStatCard label="کد موجود" value={product.codeAvailable} tone={product.codeAvailable > 5 ? "success" : product.codeAvailable > 0 ? "warning" : "default"} />
        <AdminStatCard label="کد رزروشده" value={product.codeReserved} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.6fr]">
        <AdminCard className="overflow-hidden">
          <AdminSectionHeader title="تنوع‌ها و قیمت‌ها" description="قیمت‌های نهایی محاسبه‌شده توسط موتور قیمت‌گذاری" />

          {variations.length === 0 ? (
            <div className="p-4">
              <AdminEmpty title="این محصول تنوعی ندارد." />
            </div>
          ) : (
            <>
              <AdminTable minWidth="1000px" className="rounded-none border-0">
                <thead>
                  <tr>
                    <th>تنوع</th>
                    <th>ریجن</th>
                    <th>مستقیم</th>
                    <th>گیفت</th>
                    <th>کد</th>
                    <th>موجودی کد</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {variations.map((variation) => (
                    <tr key={variation.databaseId}>
                      <td>
                        <div className="text-sm font-bold text-white">{variation.name || `#${variation.databaseId}`}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-brand-m_khonsa">
                          <span dir="ltr">#{variation.databaseId}</span>
                          {variation.status !== "publish" && <AdminBadge tone="warning">غیرفعال</AdminBadge>}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs uppercase text-white" dir="ltr">{variation.region || "—"}</span>
                        {variation.baseForeignPrice && (
                          <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">
                            {variation.baseForeignPrice} {variation.currency}
                          </div>
                        )}
                      </td>
                      <td className="text-xs text-white">{faPrice(variation.directPrice)}</td>
                      <td className="text-xs text-white">{faPrice(variation.giftPrice)}</td>
                      <td className="text-xs text-white">{faPrice(variation.codePrice)}</td>
                      <td>
                        <AdminBadge tone={stockTone(variation)}>{faNumber(variation.codeAvailable)} موجود</AdminBadge>
                        <div className="mt-1 text-xs text-brand-m_khonsa">
                          {faNumber(variation.codeReserved)} رزرو · {faNumber(variation.codeUsed)} مصرف
                        </div>
                      </td>
                      <td>
                        {canKeys && (
                          <Link href={keysHref(product.databaseId, variation.databaseId)} prefetch={false} className="text-xs font-black text-brand-blue hover:text-white">
                            افزودن کد
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>

              <div className="p-3 lg:hidden">
                <AdminMobileList>
                  {variations.map((variation) => (
                    <AdminListCard key={variation.databaseId}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-white">{variation.name || `#${variation.databaseId}`}</div>
                          <div className="mt-1 text-xs uppercase text-brand-m_khonsa" dir="ltr">{variation.region || "—"} · #{variation.databaseId}</div>
                        </div>
                        <AdminBadge tone={stockTone(variation)}>{faNumber(variation.codeAvailable)} موجود</AdminBadge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="text-brand-m_khonsa">مستقیم</div>
                          <div className="mt-1 font-bold text-white">{faPrice(variation.directPrice)}</div>
                        </div>
                        <div>
                          <div className="text-brand-m_khonsa">گیفت</div>
                          <div className="mt-1 font-bold text-white">{faPrice(variation.giftPrice)}</div>
                        </div>
                        <div>
                          <div className="text-brand-m_khonsa">کد</div>
                          <div className="mt-1 font-bold text-white">{faPrice(variation.codePrice)}</div>
                        </div>
                      </div>
                      {canKeys && (
                        <div className="mt-3 flex justify-end">
                          <Link href={keysHref(product.databaseId, variation.databaseId)} prefetch={false} className="text-xs font-black text-brand-blue hover:text-white">
                            افزودن کد
                          </Link>
                        </div>
                      )}
                    </AdminListCard>
                  ))}
                </AdminMobileList>
              </div>
            </>
          )}
        </AdminCard>

        <AdminCard className="h-fit overflow-hidden">
          <AdminSectionHeader title="اطلاعات" />
          <div className="p-4">
            <AdminFieldRow label="شناسه" value={`#${product.databaseId}`} />
            <AdminFieldRow label="اسلاگ" value={product.slug} />
            <AdminFieldRow label="وضعیت" value={STATUS_LABEL[product.status] ?? product.status} ltr={false} />
            <AdminFieldRow label="دسته‌بندی" value={categories.length ? categories.join("، ") : "—"} ltr={false} />
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}