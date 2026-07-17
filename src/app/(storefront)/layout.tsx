import { Suspense } from "react";
import Header from "@/components/Header/Header";
import SubHeaderBar from "@/components/Header/SubHeaderBar";
import HeaderSkeleton from "@/components/Header/HeaderSkeleton";
import Footer from "@/components/Footer/Footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <SubHeaderBar />
      {children}
      <Footer />
    </>
  );
}