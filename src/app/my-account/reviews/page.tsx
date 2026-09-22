import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { MY_REVIEWS_QUERY } from "@/lib/graphql/auth";
import MyReviewsList from "@/components/account/MyReviewsList";
import { AccountReviewsLoadingShell } from "@/components/account/AccountPageLoadingShell";

type ReviewsData = Awaited<ReturnType<typeof fetchGraphQL>>;

async function ReviewsDataStream({ dataPromise }: { dataPromise: Promise<ReviewsData> }) {
  const data = await dataPromise;
  const reviews = data?.myReviews?.nodes ?? [];
  const pageInfo = data?.myReviews?.pageInfo ?? { hasNextPage: false, endCursor: null };
  return <MyReviewsList initialReviews={reviews} initialPageInfo={pageInfo} />;
}

export default async function MyReviewsPage() {
  const tokenPromise = getAuthToken();
  const dataPromise = tokenPromise.then((token) =>
    fetchGraphQL(MY_REVIEWS_QUERY, {}, [], "no-store", token || undefined)
  );
  const userPromise = getCurrentUser();
  const user = await userPromise;

  if (!user) redirect("/my-account");

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

      <Suspense fallback={<AccountReviewsLoadingShell />}>
        <ReviewsDataStream dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}
