"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAdminContext } from "./AdminContext";
import AdminProductPicker, { type ProductPickerValue } from "./AdminProductPicker";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminFilterBar,
  AdminListCard,
  AdminMobileList,
  AdminPage,
  AdminPageIntro,
  AdminRefreshButton,
  AdminSectionHeader,
  AdminSelect,
  AdminTable,
  AdminTextarea,
} from "./AdminUi";
import { AdminErrorBanner, AdminListCount, AdminLoadMore, AdminSkeletonRows } from "./AdminListParts";
import { useAdminList, type AdminListData } from "./useAdminList";
import { faDate, faNumber } from "./format";
import { CDKEY_STATUS_LABELS, cdkeyStatusTone } from "./labels";

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

const DELETABLE = new Set(["available", "duplicate", "failed", "decrypt_failed"]);

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" }) {
  const toneClass = { default: "text-brand-active", success: "text-brand-sabz", warning: "text-brand-zard" }[tone];
  return (
    <div className="px-4 py-3">
      <div className="text-[13px] text-brand-m_khonsa">{label}</div>
      <div className={`mt-1 text-[20px] font-semibold leading-7 tabular-nums ${toneClass}`}>{faNumber(value)}</div>
    </div>
  );
}

export default function AdminCdKeysClient({
  initial,
  initialProductId = "",
  initialVariationId = "",
}: {
  initial?: Data;
  initialProductId?: string;
  initialVariationId?: string;
}) {
  const { permissions } = useAdminContext();
  const [status, setStatus] = useState("all");
  const [selection, setSelection] = useState<ProductPickerValue>({
    productId: initialProductId,
    variationId: initialVariationId,
  });
  const [keys, setKeys] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const params = useMemo(
    () => ({ status, productId: selection.productId, variationId: selection.variationId }),
    [status, selection.productId, selection.variationId]
  );

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<Data>({
    endpoint: "/api/admin/cdkeys",
    params,
    initial,
    debounceMs: 150,
  });

  const canWrite = permissions.includes("cdkeys.write");
  const summary = data.summary ?? { available: 0, reserved: 0, used: 0, failed: 0, total: 0 };
  const showSkeleton = loading && data.nodes.length === 0;
  const hasSelection = Number(selection.productId) > 0 && Number(selection.variationId) > 0;
  const readyToImport = hasSelection && keys.trim().length > 0;

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
    if (!readyToImport) {
      notify("محصول، تنوع و حداقل یک کلید را مشخص کنید", true);
      return;
    }

    setBusy(true);
    notify("");
    try {
      const json = await post({
        action: "import",
        productId: Number(selection.productId),
        variationId: Number(selection.variationId),
        keys,
      });
      const result = json?.adminImportCdKeys;
      notify(`${faNumber(result?.added)} کد اضافه شد؛ ${faNumber(result?.rejected)} مورد رد شد.`);
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
        title="CD Keyها"
        description="موجودی و تخصیص کلیدها را مدیریت کن؛ متن کلیدها در فهرست نمایش داده نمی‌شود."
        action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />}
      />

      {summary.available <= 5 ? (
        <div role="status" className="mb-4 border-r-2 border-brand-zard bg-brand-zard/10 px-4 py-2.5 text-[13px] text-brand-zard">
          موجودی CD Key پایین است؛ فقط {faNumber(summary.available)} کلید آماده تخصیص باقی مانده.
        </div>
      ) : null}

      <AdminCard className="mb-4 overflow-hidden">
        <div className="grid grid-cols-2 divide-brand-surface_hover sm:grid-cols-4 sm:divide-x sm:divide-x-reverse">
          <Stat label="موجود" value={summary.available} tone="success" />
          <Stat label="رزروشده" value={summary.reserved} />
          <Stat label="مصرف‌شده" value={summary.used} />
          <Stat label="خطادار" value={summary.failed} tone={summary.failed ? "warning" : "default"} />
        </div>
      </AdminCard>

      <AdminCard className="mb-4 overflow-hidden">
        <AdminSectionHeader
          title={canWrite ? "محصول و افزودن موجودی" : "فیلتر بر اساس محصول"}
          description={
            canWrite
              ? "ابتدا محصول و تنوع را انتخاب کن؛ فهرست پایین هم بر همین اساس فیلتر می‌شود."
              : "محصول و تنوع را انتخاب کن تا فهرست پایین فیلتر شود."
          }
        />
        <div className="space-y-3 p-4">
          <AdminProductPicker value={selection} onChange={setSelection} disabled={busy} />

          {canWrite && hasSelection ? (
            <>
              <AdminTextarea
                value={keys}
                onChange={(event) => setKeys(event.target.value)}
                rows={5}
                placeholder="هر CD Key در یک خط"
                dir="ltr"
              />
              <div className="flex flex-wrap items-center gap-3">
                <AdminButton variant="primary" onClick={() => void importKeys()} disabled={busy || !readyToImport}>
                  افزودن به موجودی
                </AdminButton>
              </div>
            </>
          ) : null}

          {message ? (
            <div className={`text-[13px] ${messageIsError ? "text-brand-zard" : "text-brand-sabz"}`}>{message}</div>
          ) : null}
        </div>
      </AdminCard>

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

          <AdminTable minWidth="760px">
            <thead>
              <tr>
                <th>محصول و تنوع</th>
                <th>وضعیت</th>
                <th>سفارش</th>
                <th>تاریخ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((row) => (
                <tr key={row.stockId}>
                  <td>
                    <div className="font-medium text-brand-active">{row.productName}</div>
                    <div className="mt-0.5 text-[12px] text-brand-m_khonsa">
                      {row.variationName} · <span dir="ltr">#{row.stockId}</span>
                    </div>
                  </td>
                  <td>
                    <AdminBadge tone={cdkeyStatusTone(row.status)}>{CDKEY_STATUS_LABELS[row.status] ?? row.status}</AdminBadge>
                    {row.failureReason ? <div className="mt-1 text-[12px] text-brand-m_khonsa">{row.failureReason}</div> : null}
                  </td>
                  <td>
                    {row.orderId ? (
                      <Link href={`/admin/orders/${row.orderId}`} prefetch={false} className="text-[13px] text-brand-blue hover:text-brand-active" dir="ltr">
                        #{row.orderId}
                      </Link>
                    ) : (
                      <span className="text-brand-m_khonsa">—</span>
                    )}
                  </td>
                  <td className="text-[13px] text-brand-m_khonsa">{faDate(row.createdAt)}</td>
                  <td>
                    {canWrite && DELETABLE.has(row.status) && !row.orderId ? (
                      <AdminButton variant="danger" onClick={() => void deleteKey(row.stockId)} disabled={busy}>
                        حذف
                      </AdminButton>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <AdminMobileList>
            {data.nodes.map((row) => (
              <AdminListCard key={row.stockId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-brand-active">{row.productName}</div>
                    <div className="mt-0.5 text-[12px] text-brand-m_khonsa">
                      {row.variationName} · #{row.stockId}
                    </div>
                  </div>
                  <AdminBadge tone={cdkeyStatusTone(row.status)}>{CDKEY_STATUS_LABELS[row.status] ?? row.status}</AdminBadge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-brand-m_khonsa">
                  <span dir="ltr">{row.orderId ? `سفارش #${row.orderId}` : "بدون سفارش"}</span>
                  <span>{faDate(row.createdAt)}</span>
                </div>
                {canWrite && DELETABLE.has(row.status) && !row.orderId ? (
                  <div className="mt-3 flex justify-end">
                    <AdminButton variant="danger" onClick={() => void deleteKey(row.stockId)} disabled={busy}>
                      حذف کلید
                    </AdminButton>
                  </div>
                ) : null}
              </AdminListCard>
            ))}
          </AdminMobileList>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />
    </AdminPage>
  );
}