import Header from "@/components/Header/Header";
import SubHeaderBar from "@/components/Header/SubHeaderBar";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <SubHeaderBar />
      {children}
    </>
  );
}