import Skeleton from "@/components/ui/Skeleton";

export default function HeaderSkeleton() {
  return (
    <header className="w-full sticky top-0 z-[10000] bg-[#15171e]">
      <div className="hidden lg:flex w-full items-center justify-between h-[60px] px-6 max-w-[1600px] mx-auto">
        <Skeleton className="h-9 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="hidden lg:flex w-full bg-brand-bg h-[100px]" />
      <div className="lg:hidden h-[60px] bg-brand-bg border-b border-white/5" />
    </header>
  );
}