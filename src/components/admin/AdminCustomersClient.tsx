"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Eye, Users } from "lucide-react";
import { AdminBadge, AdminButton, AdminEmpty, AdminFilterBar, AdminListCard, AdminMobileList, AdminPage, AdminPageIntro, AdminRefreshButton, AdminSearchInput, AdminTable } from "./AdminUi";

type Customer={databaseId:number;name:string;email:string;registeredAt:string;isStaff:boolean;ordersCount:number;ticketsCount:number;reviewsCount:number};

export default function AdminCustomersClient({initial}:{initial?:{nodes:Customer[];pageInfo:{hasNextPage:boolean;endCursor:string|null}}}){
  const empty={nodes:[] as Customer[],pageInfo:{hasNextPage:false,endCursor:null as string|null}};
  const [data,setData]=useState(initial??empty),[search,setSearch]=useState(""),[loading,setLoading]=useState(!initial);
  const load=async(after?:string|null)=>{setLoading(true);try{const q=new URLSearchParams({search});if(after)q.set("after",after);const r=await fetch(`/api/admin/customers?${q}`,{cache:"no-store"});if(r.ok)setData(await r.json())}finally{setLoading(false)}};
  useEffect(()=>{if(!initial)void load()},[]);
  return <AdminPage>
    <AdminPageIntro eyebrow="حساب‌ها" title="مشتریان" description="پرونده عملیاتی مشتری و ارتباط آن با سفارش‌ها، تیکت‌ها و دیدگاه‌ها." action={<AdminRefreshButton onClick={()=>void load()} loading={loading}/>}/>
    <AdminFilterBar><AdminSearchInput value={search} onChange={setSearch} onEnter={()=>void load()} placeholder="نام، ایمیل یا نام کاربری"/><AdminButton variant="primary" onClick={()=>void load()} className="lg:min-w-[96px]">جستجو</AdminButton></AdminFilterBar>
    {data.nodes.length===0?<AdminEmpty title="مشتری‌ای با این جستجو پیدا نشد."/>:<>
      <AdminTable minWidth="920px"><thead><tr><th>مشتری</th><th>ایمیل</th><th>سفارش</th><th>تیکت</th><th>دیدگاه</th><th>ثبت‌نام</th><th/></tr></thead><tbody>{data.nodes.map(c=><tr key={c.databaseId}><td><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-white/[.04] text-brand-m_khonsa"><Users size={15}/></span><div><div className="text-xs font-black text-white">{c.name||"—"}</div><div className="mt-1 flex items-center gap-1 text-[9px] text-brand-m_khonsa">#{c.databaseId}{c.isStaff&&<AdminBadge tone="info">مدیر</AdminBadge>}</div></div></div></td><td><span className="text-[10px] text-white" dir="ltr">{c.email}</span></td><td className="text-[11px] font-bold text-white">{c.ordersCount.toLocaleString("fa-IR")}</td><td className="text-[11px] font-bold text-white">{c.ticketsCount.toLocaleString("fa-IR")}</td><td className="text-[11px] font-bold text-white">{c.reviewsCount.toLocaleString("fa-IR")}</td><td><span className="text-[9px] text-brand-m_khonsa">{c.registeredAt?new Date(c.registeredAt).toLocaleDateString("fa-IR"):"—"}</span></td><td><Link href={`/admin/customers/${c.databaseId}`} className="inline-flex items-center gap-1 text-[10px] font-black text-brand-blue hover:text-white"><Eye size={14}/> پروفایل</Link></td></tr>)}</tbody></AdminTable>
      <AdminMobileList>{data.nodes.map(c=><AdminListCard key={c.databaseId} href={`/admin/customers/${c.databaseId}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-sm font-black text-white">{c.name||"بدون نام"}</div><div className="mt-1 truncate text-[10px] text-brand-m_khonsa" dir="ltr">{c.email}</div></div>{c.isStaff&&<AdminBadge tone="info">مدیر</AdminBadge>}</div><div className="mt-4 grid grid-cols-3 gap-3"><Mini label="سفارش" value={c.ordersCount}/><Mini label="تیکت" value={c.ticketsCount}/><Mini label="دیدگاه" value={c.reviewsCount}/></div></AdminListCard>)}</AdminMobileList>
    </>}
    {data.pageInfo.hasNextPage&&<div className="mt-4 flex justify-center"><AdminButton onClick={()=>void load(data.pageInfo.endCursor)} disabled={loading}><ChevronLeft size={15}/> صفحه بعد</AdminButton></div>}
  </AdminPage>
}
function Mini({label,value}:{label:string;value:number}){return <div><div className="text-[9px] text-brand-m_khonsa">{label}</div><div className="mt-1 text-xs font-black text-white">{value.toLocaleString("fa-IR")}</div></div>}
