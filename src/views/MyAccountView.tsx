import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "@/components/account/LoginForm";
import AccountDashboard from "@/components/account/AccountDashboard";

export default async function MyAccountView() {
  const user = await getCurrentUser();

  return (
    <main className="container mx-auto px-4 md:px-6 max-w-2xl py-10 md:py-16 text-brand-active" dir="rtl">
      {user ? <AccountDashboard user={user} /> : <LoginForm />}
    </main>
  );
}