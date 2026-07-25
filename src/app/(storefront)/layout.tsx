import { Suspense } from "react";
import Header from "@/components/Header/Header";
import SubHeaderBar from "@/components/Header/SubHeaderBar";
import HeaderSkeleton from "@/components/Header/HeaderSkeleton";
import Footer from "@/components/Footer/Footer";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <SubHeaderBar />
      <div className="pb-[calc(58px+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
        <Footer />
      </div>
      <ScrollToTopButton />
    </>
  );
}