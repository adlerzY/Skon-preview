"use client";

import { useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminFilterBar,
  AdminListCard,
  AdminMobileList,
  AdminPage,
  AdminPageIntro,
  AdminRefreshButton,
  AdminSectionHeader,
  AdminSelect,
  AdminStatCard,
  AdminTable,
  AdminTextarea,
} from "./AdminUi";
import { AdminErrorBanner, AdminListCount, AdminLoadMore, AdminSkeletonRows } from "./AdminListParts";
import { useAdminList, type AdminListData } from "./useAdminList";

interface Row {
  stockId: number;
  productId: number;
  variationId: number;
  productName: string;
  variationName: string;
  status: string;
  orderId: number | null;
  itemId: number | null;
  createdAt: string | null;
  usedAt: string | null;
  failureReason: string | null;
  assignmentAttempts: number;
}

interface Data extends AdminListData<Row> {
  summary: { available: number; reserved: number; used: number; failed: number; total: number };
}

const LABELS: Record<string, string> = {
  available: "موجود",
  reserved: "رزروشده",
  used: "مصرف‌شده",
  duplicate: "تکراری",
  decrypt_failed: "خطای رمزگشایی",
  failed: "ناموفق",
};

const DELETABLE = new Set(["available", "duplicate", "failed", "decrypt_failed"]);

const tone = (status: string): "success" | "danger" | "neutral" =>
  status === "available" ? "success" : status === "failed" || status === "decrypt_failed" ? "danger" : "neutral";

export default function AdminCdKeysClient({ initial }: { initial?: Data }) {
  const { permissions } = useAdminContext();
  const [status, setStatus] = useState("all");
  const [productId, setProductId] = useState("");
  const [variationId, setVariationId] = useState("");
  const [keys, setKeys] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const params = useMemo(
    () => ({ status, productId: productId.trim(), variationId: variationId.trim() }),
    [status, productId, variationId]
  );

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<Data>({
    endpoint: "/api/admin/cdkeys",
    params,
    initial,
  });

  const canWrite = permissions.includes("cdkeys.write");
  const summary = data.summary ?? { available: 0, reserved: 0, used: 0, failed: 0, total: 0 };
  const showSkeleton = loading && data.nodes.length === 0;

  const notify = (text: string, isError = false) => {
    setMessage(text);
    setMessageIsError(isError);
  };

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/admin/cdkeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) throw new Error(json?.error || "عملیات انجام نشد");
    return json;
  };

  const importKeys = async () => {
    const pid = Number(productId);
    const vid = Number(variationId);
    if (!Number.isInteger(pid) || pid <= 0 || !Number.isInteger(vid) || vid <= 0 || !keys.trim()) {
      notify("شناسه محصول، شناسه تنوع و حداقل یک کلید را وارد کنید", true);
      return;
    }

    setBusy(true);
    notify("");
    try {
      const json = await post({ action: "import", productId: pid, variationId: vid, keys });
      const result = json?.adminImportCdKeys;
      notify(
        `${Number(result?.added ?? 0).toLocaleString("fa-IR")} کد اضافه شد؛ ${Number(result?.rejected ?? 0).toLocaleString("fa-IR")} مورد رد شد.`
      );
      setKeys("");
      await refresh();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "ورود CD Key انجام نشد", true);
    } finally {
      setBusy(false);
    }
  };

  const deleteKey = async (stockId: number) => {
    if (!window.confirm("این کلید حذف شود؟")) return;
    setBusy(true);
    notify("");
    try {
      await post({ action: "delete", stockId });
      notify("کلید حذف شد.");
      await refresh();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "حذف CD Key انجام نشد", true);
    } finally {
      setBusy(false);
    }
  };

  if (!permissions.includes("cdkeys.read")) {
    return (
      <AdminPage>
        <AdminEmpty title="دسترسی به مدیریت CD Key ندارید." />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageIntro
        eyebrow="زیرساخت"
        title="CD Keyها"
        description="موجودی و تخصیص کلیدها را مدیریت کن؛ متن کلیدها در فهرست نمایش داده نمی‌شود."
        action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />}
      />

      {summary.available <= 5 && (
        <AdminCard className="mb-3 border-amber-400/20 bg-amber-400/[.05] p-3">
          <div className="text-sm font-black text-amber-200">موجودی CD Key پایین است.</div>
          <div className="mt-1 text-xs leading-6 text-brand-m_khonsa">
            فقط {Number(summary.available).toLocaleString("fa-IR")} کلید آماده تخصیص باقی مانده؛ قبل از رسیدن سفارش‌های بعدی موجودی را بررسی کن.
          </div>
        </AdminCard>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="موجود" value={summary.available} helper="آماده تخصیص" tone="success" />
        <AdminStatCard label="رزروشده" value={summary.reserved} helper="در انتظار تحویل" />
        <AdminStatCard label="مصرف‌شده" value={summary.used} helper="تحویل‌شده" />
        <AdminStatCard label="خطادار" value={summary.failed} helper="نیازمند بررسی" tone={summary.failed ? "warning" : "default"} />
      </div>

      {canWrite && (
        <AdminCard className="mb-4 overflow-hidden">
          <AdminSectionHeader
            icon={<UploadCloud size={17} />}
            title="افزودن موجودی"
            description="شناسه محصول و تنوع را وارد کن و هر کلید را در یک خط قرار بده. همین دو فیلد، فهرست پایین را هم فیلتر می‌کنند."
          />
          <div className="p-4">
            <div className="grid gap-2 md:grid-cols-2">
              <AdminField value={productId} onChange={(event) => setProductId(event.target.value)} placeholder="شناسه محصول" dir="ltr" inputMode="numeric" />
              <AdminField value={variationId} onChange={(event) => setVariationId(event.target.value)} placeholder="شناسه تنوع" dir="ltr" inputMode="numeric" />
            </div>
            <AdminTextarea
              value={keys}
              onChange={(event) => setKeys(event.target.value)}
              rows={5}
              placeholder="هر CD Key در یک خط"
              className="mt-2"
              dir="ltr"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <AdminButton variant="primary" onClick={() => void importKeys()} disabled={busy || !keys.trim()}>
                افزودن به موجودی
              </AdminButton>
              {message && (
                <span className={`text-xs ${messageIsError ? "text-red-300" : "text-emerald-300"}`}>{message}</span>
              )}
            </div>
          </div>
        </AdminCard>
      )}

      <AdminFilterBar>
        <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)} className="lg:w-[240px] lg:flex-none">
          <option value="all">همه وضعیت‌ها</option>
          <option value="available">موجود</option>
          <option value="reserved">رزروشده</option>
          <option value="used">مصرف‌شده</option>
          <option value="duplicate">تکراری</option>
          <option value="decrypt_failed">خطای رمزگشایی</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="کلیدی با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="980px">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>محصول</th>
                <th>تنوع</th>
                <th>وضعیت</th>
                <th>سفارش</th>
                <th>تاریخ</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((row) => (
                <tr key={row.stockId}>
                  <td className="text-xs text-white" dir="ltr">#{row.stockId}</td>
                  <td>
                    <div className="text-xs font-bold text-white">{row.productName}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">{row.productId}</div>
                  </td>
                  <td>
                    <div className="text-xs text-white">{row.variationName}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">{row.variationId}</div>
                  </td>
                  <td>
                    <AdminBadge tone={tone(row.status)}>{LABELS[row.status] ?? row.status}</AdminBadge>
                  </td>
                  <td className="text-xs text-white" dir="ltr">{row.orderId ? `#${row.orderId}` : "—"}</td>
                  <td className="text-xs text-brand-m_khonsa">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString("fa-IR") : "—"}
                  </td>
                  <td>
                    {canWrite && DELETABLE.has(row.status) && !row.orderId && (
                      <AdminButton variant="danger" onClick={() => void deleteKey(row.stockId)} disabled={busy} className="min-h-9 px-3 text-xs">
                        حذف
                      </AdminButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <AdminMobileList>
            {data.nodes.map((row) => (
              <AdminListCard key={row.stockId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-white">{row.productName}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa">#{row.stockId} · {row.variationName}</div>
                  </div>
                  <AdminBadge tone={tone(row.status)}>{LABELS[row.status] ?? row.status}</AdminBadge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-brand-m_khonsa">سفارش</div>
                    <div className="mt-1 text-xs text-white" dir="ltr">{row.orderId ? `#${row.orderId}` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-brand-m_khonsa">تلاش تخصیص</div>
                    <div className="mt-1 text-xs text-white" dir="ltr">{row.assignmentAttempts}</div>
                  </div>
                </div>
                {canWrite && DELETABLE.has(row.status) && !row.orderId && (
                  <div className="mt-3 flex justify-end">
                    <AdminButton variant="danger" onClick={() => void deleteKey(row.stockId)} disabled={busy}>
                      حذف کلید
                    </AdminButton>
                  </div>
                )}
              </AdminListCard>
            ))}
          </AdminMobileList>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />
    </AdminPage>
  );
}