import type { Metadata } from "next";
import SupportPage from "@/views/SupportPage";
import { makeMetadata, SEO_REGION } from "@/lib/seo/site";

interface SupportRoutePageProps {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: SupportRoutePageProps): Promise<Metadata> {
  const { region } = await params;
  return makeMetadata({
    title: "پشتیبانی",
    description: "ارتباط با پشتیبانی Arena2Battle برای سفارش‌ها، تحویل و مشکلات فنی.",
    path: region === SEO_REGION ? `/${SEO_REGION}/support` : undefined,
    noIndex: region !== SEO_REGION,
  });
}

export default async function Page({ params }: SupportRoutePageProps) {
  const { region } = await params;
  return <SupportPage region={region} />;
}
