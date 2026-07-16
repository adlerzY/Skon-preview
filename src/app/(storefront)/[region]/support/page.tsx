import SupportPage from "@/views/SupportPage";

interface SupportRoutePageProps {
  params: Promise<{ region: string }>;
}

export default async function Page({ params }: SupportRoutePageProps) {
  const { region } = await params;
  return <SupportPage region={region} />;
}