import type { ReactNode } from "react";
import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminBootstrap } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "پنل مدیریت",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const bootstrap = await getAdminBootstrap();
  return <AdminShell initialContext={bootstrap}>{children}</AdminShell>;
}
