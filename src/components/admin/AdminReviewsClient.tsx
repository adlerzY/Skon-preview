"use client";

import { useEffect, useState } from "react";
import { Check, EyeOff, Flag, Star } from "lucide-react";
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminFilterBar, AdminPage, AdminPageIntro, AdminRefreshButton, AdminSelect } from "./AdminUi";

type Review={databaseId:number;content:string;rating:number;date:string;status:string;moderationState:string;userName:string;userEmail:string;productId:number;productName:string};
const STATES: Record<string,string>={pending:"در انتظار بررسی",published:"منتشرشده",flagged:"علامت‌گذاری‌شده",hidden:"مخفی"};

export default function AdminReviewsClient({initial}:{initial?:{nodes:Review[];pageInfo:{hasNextPage:boolean;endCursor:string|null}}}){
  const empty={nodes:[] as Review[],pageInfo:{hasNextPage:false,endCursor:null as string|null}};const[data,setData]=useState(initial??empty),[state,setState]=useState("pending"),[loading,setLoading]=useState(!initial);
  const load=async(after?:string|null)=>{setLoading(true);try{const q=new URLSearchParams({state});if(after)q.set("after",after);const r=await fetch(`/api/admin/reviews?${q}`,{cache:"no-store"});if(r.ok)setData(await r.json())}finally{setLoading(false)}};
  const action=async(id:number,a:string)=>{setLoading(true);try{await fetch("/api/admin/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"moderate",reviewId:id,moderationAction:a})});await load()}finally{setLoading(false)}};
  useEffect(()=>{if(!initial)void load()},[]);
  return <AdminPage><AdminPageIntro eyebrow="عملیات" title="دیدگاه‌ها" description="صف moderation را کوتاه نگه دار و فقط موارد لازم را بررسی کن." action={<AdminRefreshButton onClick={()=>void load()} loading={loading}/>}/>
    <AdminFilterBar><AdminSelect value={state} onChange={e=>setState(e.target.value)} className="lg:w-[220px] lg:flex-none"><option value="pending">در انتظار بررسی</option><option value="published">منتشرشده</option><option value="flagged">علامت‌گذاری‌شده</option><option value="hidden">مخفی</option></AdminSelect><AdminButton variant="primary" onClick={()=>void load()} className="lg:min-w-[96px]">اعمال</AdminButton></AdminFilterBar>
    {data.nodes.length===0?<AdminEmpty title="موردی در این صف وجود ندارد."/>:<div className="grid gap-3">{data.nodes.map(r=><AdminCard key={r.databaseId} className="overflow-hidden"><div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><div className="truncate text-sm font-black text-white">{r.productName||"محصول"}</div><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-brand-m_khonsa"><span>{r.userName||"کاربر"}</span><span>#{r.databaseId}</span><span className="inline-flex items-center gap-1 text-brand-zard"><Star size={11} fill="currentColor"/>{r.rating}/5</span><AdminBadge>{STATES[state]??state}</AdminBadge></div></div><div className="text-[9px] text-brand-m_khonsa" dir="ltr">{r.date?new Date(r.date).toLocaleString("fa-IR"):"—"}</div></div><div className="mx-4 rounded-[4px] border border-white/[.04] bg-brand-bg p-4 text-xs leading-6 text-white whitespace-pre-wrap">{r.content}</div><div className="flex flex-wrap gap-2 p-4 pt-3">{state!=="published"&&<AdminButton variant="primary" onClick={()=>void action(r.databaseId,"approve")} disabled={loading} className="min-h-9 px-3 text-[10px]"><Check size={13}/> تأیید</AdminButton>}{state!=="hidden"&&<AdminButton onClick={()=>void action(r.databaseId,"hide")} disabled={loading} className="min-h-9 px-3 text-[10px]"><EyeOff size={13}/> مخفی</AdminButton>}{state!=="flagged"&&<AdminButton variant="danger" onClick={()=>void action(r.databaseId,"flag")} disabled={loading} className="min-h-9 px-3 text-[10px]"><Flag size={13}/> علامت‌گذاری</AdminButton>}</div></AdminCard>)}</div>}
    {data.pageInfo.hasNextPage&&<div className="mt-4 flex justify-center"><AdminButton onClick={()=>void load(data.pageInfo.endCursor)} disabled={loading}>صفحه بعد</AdminButton></div>}
  </AdminPage>
}
