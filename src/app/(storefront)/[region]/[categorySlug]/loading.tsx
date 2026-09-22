import { HeroLayoutShell, ProductGridLayoutShell } from "@/components/home/HomeSkeletons";

export default function Loading() {
  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <HeroLayoutShell />
      <div className="mt-8">
        <ProductGridLayoutShell />
      </div>
    </main>
  );
}
