import { HeroLayoutShell, ProductGridLayoutShell } from "@/components/home/HomeSkeletons";

export default function Loading() {
  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <HeroLayoutShell />
      <section className="w-full my-4">
        <div className="flex items-center justify-between mt-5 mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-white">محصولات ویژه و پرطرفدار</h2>
        </div>
        <ProductGridLayoutShell showTitle={false} />
      </section>
      <section className="w-full my-4">
        <div className="flex items-center justify-between mt-5 mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-white">جدیدترین محصولات</h2>
        </div>
        <ProductGridLayoutShell showTitle={false} />
      </section>
    </main>
  );
}
