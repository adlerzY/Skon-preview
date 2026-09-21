"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, UploadCloud } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminField, AdminPage, AdminPageIntro, AdminRefreshButton, AdminSectionHeader, AdminSelect, AdminStatCard, AdminTable, AdminTextarea, AdminMobileList, AdminListCard } from "./AdminUi";

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
interface Data {
  nodes: Row[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  summary: { available: number; reserved: number; used: number; failed: number; total: number };
}

const LABELS: Record<string, string> = { available: "موجود", reserved: "رزروشده", used: "مصرف‌شده", duplicate: "تکراری", decrypt_failed: "خطای رمزگشایی" };

export default function AdminCdKeysClient({ initial }: { initial?: Data }) {
  const { permissions } = useAdminContext();
  const empty: Data = { nodes: [], pageInfo: { hasNextPage: false, endCursor: null }, summary: { available: 0, reserved: 0, used: 0, failed: 0, total: 0 } };
  const [data, setData] = useState<Data>(initial ?? empty);
  const [status, setStatus] = useState("all");
  const [productId, setProductId] = useState("");
  const [variationId, setVariationId] = useState("");
  const [keys, setKeys] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async (after?: string | null) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status });
      if (productId.trim()) qs.set("productId", productId.trim());
      if (variationId.trim()) qs.set("variationId", variationId.trim());
      if (after) qs.set("after", after);
      const response = await fetch(`/api/admin/cdkeys?${qs.toString()}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "خطا در دریافت موجودی");
      setData(json);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در دریافت موجودی");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!initial) void load(); }, [initial]);

  const importKeys = async () => {
    if (!productId || !variationId || !keys.trim()) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/cdkeys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import", productId: Number(productId), variationId: Number(variationId), keys }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "ورود CD Key انجام نشد");
      setMessage(`${json?.adminImportCdKeys?.added ?? 0} کد اضافه شد؛ ${json?.adminImportCdKeys?.rejected ?? 0} مورد رد شد.`);
      setKeys("");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "ورود CD Key انجام نشد"); }
    finally { setLoading(false); }
  };

  const deleteKey = async (stockId: number) => {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/cdkeys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", stockId }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "حذف CD Key انجام نشد");
      setMessage("کلید حذف شد."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "حذف CD Key انجام نشد"); }
    finally { setLoading(false); }
  };

  if (!permissions.includes("cdkeys.read")) return <AdminPage><AdminEmpty title="دسترسی به مدیریت CD Key ندارید." /></AdminPage>;

  return <AdminPage>
    <AdminPageIntro eyebrow="زیرساخت" title="CD Keyها" description="موجودی و تخصیص کلیدها را مدیریت کن؛ متن کلیدها در فهرست نمایش داده نمی‌شود." action={<AdminRefreshButton onClick={() => void load()} loading={loading} />} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
      <AdminStatCard label="موجود" value={data.summary.available} helper="آماده تخصیص" tone="success" />
      <AdminStatCard label="رزروشده" value={data.summary.reserved} helper="در انتظار تحویل" />
      <AdminStatCard label="مصرف‌شده" value={data.summary.used} helper="تحویل‌شده" />
      <AdminStatCard label="خطادار" value={data.summary.failed} helper="نیازمند بررسی" tone={data.summary.failed ? "warning" : "default"} />
    </div>

    {permissions.includes("cdkeys.write") && <AdminCard className="mb-4 overflow-hidden">
      <AdminSectionHeader icon={<UploadCloud size={17}/>} title="افزودن موجودی" description="شناسه محصول و تنوع را وارد کن و هر کلید را در یک خط قرار بده." />
      <div className="p-4">
        <div className="grid gap-2 md:grid-cols-2"><AdminField value={productId} onChange={e=>setProductId(e.target.value)} placeholder="شناسه محصول" dir="ltr"/><AdminField value={variationId} onChange={e=>setVariationId(e.target.value)} placeholder="شناسه تنوع" dir="ltr"/></div>
        <AdminTextarea value={keys} onChange={e=>setKeys(e.target.value)} rows={5} placeholder="هر CD Key در یک خط" className="mt-2" dir="ltr"/>
        <div className="mt-3 flex flex-wrap items-center gap-2"><AdminButton variant="primary" onClick={importKeys} disabled={loading || !productId || !variationId || !keys.trim()}>افزودن به موجودی</AdminButton>{message&&<span className="text-[10px] text-brand-m_khonsa">{message}</span>}</div>
      </div>
    </AdminCard>}

    <AdminCard className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-white/[.06] p-3 sm:flex-row"><AdminSelect value={status} onChange={e=>setStatus(e.target.value)} className="sm:max-w-[220px]"><option value="all">همه وضعیت‌ها</option><option value="available">موجود</option><option value="reserved">رزروشده</option><option value="used">مصرف‌شده</option><option value="duplicate">تکراری</option><option value="decrypt_failed">خطای رمزگشایی</option></AdminSelect><AdminButton variant="primary" onClick={()=>void load()}>اعمال فیلتر</AdminButton></div>
      <div className="hidden lg:block overflow-x-auto"><table className="w-full border-collapse text-right [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-white/[.06] [&_th]:px-3.5 [&_th]:py-3 [&_th]:text-[9px] [&_th]:font-black [&_th]:text-brand-m_khonsa [&_td]:border-b [&_td]:border-white/[.06] [&_td]:px-3.5 [&_td]:py-3 [&_td]:align-middle [&_tr:last-child_td]:border-b-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-white/[.02] min-w-[980px]"><thead><tr><th>شناسه</th><th>محصول</th><th>تنوع</th><th>وضعیت</th><th>سفارش</th><th>تاریخ</th><th>عملیات</th></tr></thead><tbody>{data.nodes.map(row=><tr key={row.stockId}><td className="text-[10px] text-white" dir="ltr">#{row.stockId}</td><td><div className="text-[10px] font-bold text-white">{row.productName}</div><div className="mt-1 text-[9px] text-brand-m_khonsa" dir="ltr">{row.productId}</div></td><td><div className="text-[10px] text-white">{row.variationName}</div><div className="mt-1 text-[9px] text-brand-m_khonsa" dir="ltr">{row.variationId}</div></td><td><AdminBadge tone={row.status==="available"?"success":row.status==="failed"||row.status==="decrypt_failed"?"danger":"neutral"}>{LABELS[row.status]??row.status}</AdminBadge></td><td className="text-[10px] text-white" dir="ltr">{row.orderId?`#${row.orderId}`:"—"}</td><td className="text-[9px] text-brand-m_khonsa">{row.createdAt?new Date(row.createdAt).toLocaleDateString("fa-IR"):"—"}</td><td>{permissions.includes("cdkeys.write") && ["available","duplicate","failed","decrypt_failed"].includes(row.status) && !row.orderId && <AdminButton onClick={()=>void deleteKey(row.stockId)} disabled={loading}>حذف</AdminButton>}</td></tr>)}</tbody></table></div>
      <div className="lg:hidden space-y-2 p-3">{data.nodes.map(row=><div key={row.stockId} className="rounded-[5px] border border-white/[.06] bg-black/10 p-3"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black text-white">{row.productName}</div><div className="mt-1 text-[9px] text-brand-m_khonsa">#{row.stockId} · {row.variationName}</div></div><AdminBadge tone={row.status==="available"?"success":row.status==="decrypt_failed"?"danger":"neutral"}>{LABELS[row.status]??row.status}</AdminBadge></div><div className="mt-3 grid grid-cols-2 gap-3"><div><div className="text-[9px] text-brand-m_khonsa">سفارش</div><div className="mt-1 text-[10px] text-white" dir="ltr">{row.orderId?`#${row.orderId}`:"—"}</div></div><div><div className="text-[9px] text-brand-m_khonsa">تلاش تخصیص</div><div className="mt-1 text-[10px] text-white" dir="ltr">{row.assignmentAttempts}</div></div></div></div>)}{data.nodes.length===0&&<AdminEmpty title="کلیدی با این فیلتر پیدا نشد."/>}</div>
      {data.nodes.length===0&&<div className="hidden lg:block p-6"><AdminEmpty title="کلیدی با این فیلتر پیدا نشد."/></div>}
    </AdminCard>
    {data.pageInfo.hasNextPage && <div className="mt-4 flex justify-center"><button onClick={()=>void load(data.pageInfo.endCursor)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-black transition disabled:pointer-events-none disabled:opacity-50 border border-brand-surface_hover bg-brand-surface_hover/60 text-white hover:bg-brand-surface_hover"><ChevronLeft size={15}/> صفحه بعد</button></div>}
  </AdminPage>;
}
