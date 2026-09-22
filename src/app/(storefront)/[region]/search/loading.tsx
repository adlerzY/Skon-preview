import SearchLoadingShell from "@/components/ui/SearchLoadingShell";

export default function Loading() {
  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <div className="h-8 w-48 rounded bg-white/[.05] mb-6" />
      <SearchLoadingShell />
    </main>
  );
}
