import type { Metadata } from "next";
import AdminLoginFlow from "@/components/account/AdminLoginFlow";

export const metadata: Metadata = {
  title: "ورود مدیریت",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLoginPage() {
  return (
    <div className="h-[100dvh] w-full bg-brand-bg flex items-center justify-center p-5 overflow-y-auto" dir="rtl">
      <AdminLoginFlow />
    </div>
  );
}
