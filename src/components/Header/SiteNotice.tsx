import { AlertCircle } from "lucide-react";

export default function SiteNotice({
  title,
  message,
  desktop = false,
}: {
  title: string;
  message: string;
  desktop?: boolean;
}) {
  return (
    <details className={`group relative ${desktop ? "flex items-center" : "flex items-center justify-center"}`}>
      <summary
        aria-label={title}
        className="flex list-none items-center justify-center w-8 h-8 rounded-full bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover hover:border-brand-zard text-brand-zard transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/70 [&::-webkit-details-marker]:hidden"
      >
        <AlertCircle size={18} />
      </summary>

      <div
        className={`absolute z-[10001] w-[min(320px,calc(100vw-32px))] pointer-events-none opacity-0 invisible transition-all duration-150 group-open:visible group-open:opacity-100 group-open:pointer-events-auto ${
          desktop
            ? "right-full top-1/2 -translate-y-1/2 mr-2"
            : "left-0 top-full pt-2"
        }`}
      >
        <div className="bg-brand-surface border border-brand-surface_hover rounded-[5px] p-3 shadow-[0_15px_30px_rgba(0,0,0,0.6)] text-right">
          <p className="text-xs font-bold text-white leading-6">{title}</p>
          <p className="mt-1 text-xs text-brand-m_khonsa leading-6">{message}</p>
        </div>
      </div>
    </details>
  );
}
