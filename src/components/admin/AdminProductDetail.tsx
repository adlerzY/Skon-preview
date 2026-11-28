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
  AdminTable,
} from "./AdminUi";
import { faNumber, faPrice } from "./format";
import { PRODUCT_STATUS_LABELS, productStatusTone } from "./labels";

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
        <Link href="/admin/products" prefetch={false} className="inline-flex items-center gap-2 text-[13px] text-brand-m_khonsa hover:text-brand-white">
          <ArrowRight size={15} /> بازگشت به محصولات
        </Link>
        <AdminBadge tone={productStatusTone(product.status)}>{PRODUCT_STATUS_LABELS[product.status] ?? product.status}</AdminBadge>
      </div>

      <AdminPageIntro
        title={product.name}
        description={`#${faNumber(product.databaseId)} · ${product.slug}`}
        action={
          <>
            {canKeys ? (
              <Link
                href={`/admin/cdkeys?productId=${product.databaseId}`}
                prefetch={false}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] bg-brand-blue px-4 text-[13px] font-medium text-brand-white hover:brightness-110"
              >
                <KeyRound size={15} /> مدیریت CD Key
              </Link>
            ) : null}
            {product.editUrl ? (
              <a
                href={product.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] border border-brand-surface_hover px-4 text-[13px] font-medium text-brand-m_khonsa hover:text-brand-white"
              >
                <ExternalLink size={15} /> ویرایش در وردپرس
              </a>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_0.6fr]">
        <AdminCard className="overflow-hidden">
          <AdminSectionHeader title="تنوع‌ها و قیمت‌ها" description="قیمت‌های نهایی محاسبه‌شده توسط موتور قیمت‌گذاری" />

          {variations.length === 0 ? (
            <AdminEmpty title="این محصول تنوعی ندارد." />
          ) : (
            <>
              <AdminTable minWidth="900px" className="rounded-none border-0">
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
                        <div className="font-medium text-brand-active">{variation.name || `#${variation.databaseId}`}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-brand-m_khonsa">
                          <span dir="ltr">#{variation.databaseId}</span>
                          {variation.status !== "publish" ? <AdminBadge tone="warning">غیرفعال</AdminBadge> : null}
                        </div>
                      </td>
                      <td>
                        <span className="text-[13px] uppercase text-brand-active" dir="ltr">
                          {variation.region || "—"}
                        </span>
                        {variation.baseForeignPrice ? (
                          <div className="mt-0.5 text-[12px] text-brand-m_khonsa" dir="ltr">
                            {variation.baseForeignPrice} {variation.currency}
                          </div>
                        ) : null}
                      </td>
                      <td className="text-brand-active">{faPrice(variation.directPrice)}</td>
                      <td className="text-brand-active">{faPrice(variation.giftPrice)}</td>
                      <td className="text-brand-active">{faPrice(variation.codePrice)}</td>
                      <td>
                        <AdminBadge tone={stockTone(variation)}>{faNumber(variation.codeAvailable)} موجود</AdminBadge>
                        <div className="mt-0.5 text-[12px] text-brand-m_khonsa">
                          {faNumber(variation.codeReserved)} رزرو · {faNumber(variation.codeUsed)} مصرف
                        </div>
                      </td>
                      <td>
                        {canKeys ? (
                          <Link href={keysHref(product.databaseId, variation.databaseId)} prefetch={false} className="text-[13px] text-brand-blue hover:text-brand-active">
                            افزودن کد
                          </Link>
                        ) : null}
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
                          <div className="text-[14px] font-medium text-brand-active">{variation.name || `#${variation.databaseId}`}</div>
                          <div className="mt-0.5 text-[12px] uppercase text-brand-m_khonsa" dir="ltr">
                            {variation.region || "—"} · #{variation.databaseId}
                          </div>
                        </div>
                        <AdminBadge tone={stockTone(variation)}>{faNumber(variation.codeAvailable)} موجود</AdminBadge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
                        <div>
                          <div className="text-brand-m_khonsa">مستقیم</div>
                          <div className="mt-0.5 text-[13px] text-brand-active">{faPrice(variation.directPrice)}</div>
                        </div>
                        <div>
                          <div className="text-brand-m_khonsa">گیفت</div>
                          <div className="mt-0.5 text-[13px] text-brand-active">{faPrice(variation.giftPrice)}</div>
                        </div>
                        <div>
                          <div className="text-brand-m_khonsa">کد</div>
                          <div className="mt-0.5 text-[13px] text-brand-active">{faPrice(variation.codePrice)}</div>
                        </div>
                      </div>
                      {canKeys ? (
                        <div className="mt-3 flex justify-end">
                          <Link href={keysHref(product.databaseId, variation.databaseId)} prefetch={false} className="text-[13px] text-brand-blue hover:text-brand-active">
                            افزودن کد
                          </Link>
                        </div>
                      ) : null}
                    </AdminListCard>
                  ))}
                </AdminMobileList>
              </div>
            </>
          )}
        </AdminCard>

        <AdminCard className="h-fit overflow-hidden">
          <AdminSectionHeader title="اطلاعات" />
          <div className="px-4 py-1">
            <AdminFieldRow label="شناسه" value={`#${product.databaseId}`} />
            <AdminFieldRow label="اسلاگ" value={product.slug} />
            <AdminFieldRow
              label="وضعیت"
              value={<AdminBadge tone={productStatusTone(product.status)}>{PRODUCT_STATUS_LABELS[product.status] ?? product.status}</AdminBadge>}
              ltr={false}
            />
            <AdminFieldRow label="دسته‌بندی" value={categories.length ? categories.join("، ") : "—"} ltr={false} />
            <AdminFieldRow label="تعداد تنوع" value={faNumber(product.variationCount)} ltr={false} />
            <AdminFieldRow label="کد موجود" value={faNumber(product.codeAvailable)} ltr={false} />
            <AdminFieldRow label="کد رزروشده" value={faNumber(product.codeReserved)} ltr={false} />
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}