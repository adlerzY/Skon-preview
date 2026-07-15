import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { MY_REVIEWS_QUERY } from "@/lib/graphql/auth";
import MyReviewsList from "@/components/account/MyReviewsList";

export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  const token = await getAuthToken();
  const data = await fetchGraphQL(MY_REVIEWS_QUERY, {}, [], "no-store", token || undefined);
  const reviews = data?.myReviews?.nodes ?? [];
  const pageInfo = data?.myReviews?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link href="/my-account" className="inline-flex items-center gap-1 text-sm text-brand-m_khonsa hover:text-white transition-colors">
        <ChevronRight size={16} />
        بازگشت به حساب کاربری
      </Link>

      <div>
        <h1 className="text-xl font-black text-white mb-1">دیدگاه‌های من</h1>
        <p className="text-sm text-brand-m_khonsa">نظراتی که برای محصولات ثبت کرده‌اید و پاسخ‌های پشتیبانی</p>
      </div>

      <MyReviewsList initialReviews={reviews} initialPageInfo={pageInfo} />
    </div>
  );
}