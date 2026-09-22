import { BlogPostLoadingShell } from "@/components/ui/BlogLoadingShells";

export default function Loading() {
  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 text-white max-w-site">
      <BlogPostLoadingShell />
    </main>
  );
}
