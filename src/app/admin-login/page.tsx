// src/app/admin-login/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminLoginFlow from "@/components/account/AdminLoginFlow";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/my-account");

  return (
    <div className="min-h-screen w-full bg-brand-bg flex items-center justify-center p-5" dir="rtl">
      <AdminLoginFlow />
    </div>
  );
}