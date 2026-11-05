import Image from "next/image";
import { Check } from "lucide-react";
import type { ContentMatrix } from "@/lib/graphql";

export default function ProductContentMatrix({
  contentMatrix,
}: {
  contentMatrix?: ContentMatrix | null;
}) {
  if (!contentMatrix || contentMatrix.columns.length === 0 || contentMatrix.items.length === 0) {
    return null;
  }

  const { columns, items, image } = contentMatrix;

  return (
    <div className="w-full border-t border-brand-surface_hover pt-5 flex flex-col gap-3" dir="rtl">
      <h2 className="text-xl font-black text-brand-active border-r-4 border-brand-blue pr-3">
        محتویات هر نسخه
      </h2>

      {image && (
        <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden bg-brand-menu border border-brand-surface_hover">
          <Image src={image} alt="" fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
        </div>
      )}

      <div className="overflow-x-auto bg-brand-menu border border-brand-surface_hover">
        <table className="w-full text-sm border-collapse min-w-[420px]">
          <thead>
            <tr className="bg-brand-surface_hover/40">
              <th className="sticky right-0 bg-brand-menu p-3 text-right font-bold text-brand-active whitespace-nowrap">
                &nbsp;
              </th>
              {columns.map((col) => (
                <th key={col.key} className="p-3 text-center font-bold text-brand-active whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={`${item.name}-${idx}`} className={idx % 2 === 1 ? "bg-white/[0.02]" : undefined}>
                <td className="sticky right-0 bg-brand-menu p-3 text-brand-m_khonsa font-medium whitespace-nowrap border-t border-brand-surface_hover">
                  {item.name}
                </td>
                {columns.map((col) => {
                  const included = item.includedIn.includes(col.key);
                  return (
                    <td key={col.key} className="p-3 text-center border-t border-brand-surface_hover">
                      {included ? (
                        <Check size={16} className="inline-block text-brand-sabz" strokeWidth={3} />
                      ) : (
                        <span className="text-brand-surface_m">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
