import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { RefreshCw, Search } from "lucide-react";

const buttonBase = "inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] px-4 text-[13px] font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue/50";
const fieldBase = "h-10 w-full min-w-0 rounded-[5px] border border-brand-surface_hover bg-brand-bg px-3 text-[14px] text-brand-active outline-none transition-colors placeholder:text-brand-surface_m focus:border-brand-blue";

export function AdminPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`w-full min-w-0 ${className}`}>{children}</div>;
}

export function AdminPageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex min-w-0 flex-col items-start justify-between gap-3 border-b border-brand-surface_hover pb-4 sm:flex-row sm:items-center">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[12px] text-brand-surface_m">{eyebrow}</div> : null}
        <h1 className="text-[20px] font-semibold leading-8 text-brand-active">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-[13px] leading-6 text-brand-m_khonsa">{description}</p> : null}
      </div>
      {action ? <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function AdminBackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} prefetch={false} className="inline-flex min-h-9 items-center gap-1.5 text-[13px] text-brand-m_khonsa transition-colors hover:text-brand-white">{children}</Link>;
}

export function AdminButton({ variant = "secondary", className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const variantClass = {
    primary: "bg-brand-blue text-brand-white hover:brightness-110",
    secondary: "border border-brand-surface_hover bg-brand-surface text-brand-m_khonsa hover:text-brand-white",
    danger: "border border-brand-zard/40 bg-brand-zard/10 text-brand-zard hover:bg-brand-zard/15",
    ghost: "bg-transparent text-brand-m_khonsa hover:bg-brand-surface hover:text-brand-white",
  }[variant];
  return <button type="button" className={`${buttonBase} ${variantClass} ${className}`} {...props}>{children}</button>;
}

export function AdminRefreshButton({ onClick, loading = false }: { onClick: () => void; loading?: boolean }) {
  return <AdminButton onClick={onClick} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {loading ? "در حال بروزرسانی" : "بروزرسانی"}</AdminButton>;
}

export function AdminCard({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`min-w-0 rounded-[5px] border border-brand-surface_hover bg-brand-surface ${className}`}>{children}</section>;
}

export function AdminSectionHeader({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b border-brand-surface_hover px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? <span className="shrink-0 text-brand-surface_m">{icon}</span> : null}
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-semibold text-brand-active">{title}</h2>
          {description ? <p className="mt-0.5 text-[12px] leading-5 text-brand-m_khonsa">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminFilterBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 flex min-w-0 flex-col gap-2 border-b border-brand-surface_hover pb-4 lg:flex-row lg:items-center ${className}`}>{children}</div>;
}

export function AdminSearchInput({ value, onChange, onEnter, placeholder }: { value: string; onChange: (value: string) => void; onEnter?: () => void; placeholder: string }) {
  return (
    <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[5px] border border-brand-surface_hover bg-brand-bg px-3 transition-colors focus-within:border-brand-blue">
      <Search size={15} className="shrink-0 text-brand-surface_m" />
      <input value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onEnter?.()} placeholder={placeholder} className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-[14px] text-brand-active outline-none placeholder:text-brand-surface_m" />
    </label>
  );
}

export function AdminField({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function AdminSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} ${className}`} {...props} />;
}

export function AdminTextarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} h-auto min-h-24 py-2.5 leading-6 ${className}`} {...props} />;
}

export function AdminTable({ children, minWidth = "1000px", className = "" }: { children: ReactNode; minWidth?: string; className?: string }) {
  return (
    <div className={`hidden min-w-0 overflow-x-auto rounded-[5px] border border-brand-surface_hover bg-brand-surface lg:block ${className}`}>
      <table style={{ minWidth }} className="w-full border-collapse text-right [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-brand-surface_hover [&_th]:px-4 [&_th]:py-3 [&_th]:text-[13px] [&_th]:font-medium [&_th]:text-brand-surface_m [&_td]:border-b [&_td]:border-brand-surface_hover [&_td]:px-4 [&_td]:py-3 [&_td]:text-[14px] [&_td]:align-middle [&_tr:last-child_td]:border-b-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-brand-surface_hover/40">{children}</table>
    </div>
  );
}

export function AdminMobileList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-2 lg:hidden ${className}`}>{children}</div>;
}

export function AdminListCard({ children, href, className = "" }: { children: ReactNode; href?: string; className?: string }) {
  const classes = `block rounded-[5px] border border-brand-surface_hover bg-brand-surface px-4 py-3 transition-colors hover:border-brand-blue/50 ${className}`;
  return href ? <Link href={href} prefetch={false} className={classes}>{children}</Link> : <div className={classes}>{children}</div>;
}

export function AdminStatCard({ label, value, helper, tone = "default" }: { label: string; value: string | number; helper?: string; tone?: "default" | "info" | "warning" | "success" }) {
  const toneClass = { default: "text-brand-active", info: "text-brand-blue", warning: "text-brand-zard", success: "text-brand-sabz" }[tone];
  return (
    <div className="min-w-0 border-l border-brand-surface_hover px-4 py-2.5 last:border-l-0">
      <div className="text-[13px] text-brand-m_khonsa">{label}</div>
      <div className={`mt-1 text-[20px] font-semibold leading-7 tabular-nums ${toneClass}`}>{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</div>
      {helper ? <div className="mt-0.5 text-[12px] text-brand-surface_m">{helper}</div> : null}
    </div>
  );
}

export function AdminEmpty({ title = "موردی پیدا نشد.", description }: { title?: string; description?: string }) {
  return <div className="px-4 py-8 text-center"><div className="text-[14px] text-brand-m_khonsa">{title}</div>{description ? <div className="mt-1 text-[12px] text-brand-surface_m">{description}</div> : null}</div>;
}

export function AdminBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "info" | "success" | "warning" | "danger" }) {
  const toneClass = {
    neutral: "bg-brand-surface_hover text-brand-m_khonsa",
    info: "bg-brand-blue/10 text-brand-blue",
    success: "bg-brand-sabz/10 text-brand-sabz",
    warning: "bg-brand-zard/10 text-brand-zard",
    danger: "border border-brand-zard/40 bg-brand-zard/10 text-brand-zard",
  }[tone];
  return <span className={`inline-flex min-h-6 items-center rounded-[5px] px-2.5 text-[12px] font-medium whitespace-nowrap ${toneClass}`}>{children}</span>;
}

export function AdminFieldRow({ label, value, ltr = true }: { label: string; value: ReactNode; ltr?: boolean }) {
  return <div className="flex items-start justify-between gap-3 border-b border-brand-surface_hover py-2.5 last:border-0"><span className="shrink-0 text-[13px] text-brand-m_khonsa">{label}</span><span className="break-all text-left text-[13px] font-medium text-brand-active" dir={ltr ? "ltr" : undefined}>{value}</span></div>;
}