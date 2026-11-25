import { NextRequest } from "next/server";
import { adminFail, adminJson, positiveInt, runAdmin, runMutation } from "@/lib/admin/api";
import { adminQuery, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_REVIEWS_QUERY } from "@/lib/graphql/admin";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { readJsonBody } from "@/lib/requestBody";

const STATES = new Set(["pending", "published", "flagged", "hidden"]);
const MODERATION_ACTIONS = new Set(["approve", "hide", "flag"]);

export function GET(request: NextRequest) {
  return runAdmin(ADMIN_PERMISSIONS.REVIEWS_MODERATE, "خطا در دریافت دیدگاه‌ها", async () => {
    const params = request.nextUrl.searchParams;
    const requested = params.get("state") || "pending";
    const data = await adminQuery(ADMIN_REVIEWS_QUERY, {
      first: 20,
      state: STATES.has(requested) ? requested : "pending",
            order: params.get("order") === "asc" ? "asc" : "desc",
      after: params.get("after") || undefined,
    });
    if (!data) return adminFail("خطا در دریافت دیدگاه‌ها", 502);
    return adminJson(data.adminReviews ?? { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } });
  });
}

export function POST(request: NextRequest) {
  return runAdmin(ADMIN_PERMISSIONS.REVIEWS_MODERATE, "عملیات دیدگاه انجام نشد", async () => {
    const body = await readJsonBody(request, 32 * 1024);
    const action = String(body?.action || "");
    const reviewId = positiveInt(body?.reviewId);
    if (!reviewId) return adminFail("شناسه دیدگاه نامعتبر است", 400);

    if (action === "moderate") {
      const moderationAction = String(body?.moderationAction || "");
      if (!MODERATION_ACTIONS.has(moderationAction)) return adminFail("عملیات نامعتبر است", 400);
      return runMutation(
        ADMIN_MUTATIONS.moderateReview,
        { reviewId, action: moderationAction },
        "adminModerateReview",
        "عملیات دیدگاه انجام نشد"
      );
    }

    if (action === "reply") {
      const content = String(body?.content ?? "").trim().slice(0, 5000);
      if (!content) return adminFail("متن پاسخ خالی است", 400);
      return runMutation(
        ADMIN_MUTATIONS.replyReview,
        { reviewId, content },
        "adminReplyToReview",
        "ثبت پاسخ انجام نشد"
      );
    }

    return adminFail("عملیات نامعتبر است", 400);
  });
}