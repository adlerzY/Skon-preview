import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const cookieStore = await cookies();
  const activeRegion = cookieStore.get("store_region")?.value || "eu";
  redirect(`/${activeRegion}`);
}