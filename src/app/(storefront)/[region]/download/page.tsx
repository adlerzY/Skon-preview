import type { Metadata } from "next";
import DownloadPage from "@/views/DownloadPage";
import { makeMetadata, SEO_REGION } from "@/lib/seo/site";

interface DownloadRoutePageProps {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: DownloadRoutePageProps): Promise<Metadata> {
  const { region } = await params;
  return makeMetadata({
    title: "دانلود بازی",
    description: "دانلود بازی‌ها با لینک مستقیم و سرعت بالا در Arena2Battle.",
    path: region === SEO_REGION ? `/${SEO_REGION}/download` : undefined,
    noIndex: region !== SEO_REGION,
  });
}

export default function Page() {
  return <DownloadPage />;
}
