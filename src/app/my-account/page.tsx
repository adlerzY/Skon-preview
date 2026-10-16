import MyAccountView from "@/views/MyAccountView";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[]; resumeCheckout?: string | string[] }>;
}) {
  const { returnTo, resumeCheckout } = await searchParams;
  return <MyAccountView resumeCart={returnTo === "/cart" && resumeCheckout === "1"} />;
}