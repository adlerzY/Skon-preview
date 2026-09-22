import type { ReactNode } from "react";
import CommerceProviders from "@/components/providers/CommerceProviders";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <CommerceProviders>
      <div className="pb-[calc(58px+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <ScrollToTopButton />
    </CommerceProviders>
  );
}
