import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { absoluteUrl } from "@/lib/seo/site";

const ALLOWED_PROVIDERS = new Set(["zarinpal", "aqayepardakht"]);

function resultUrl(result: string, orderId?: string) {
  const query = new URLSearchParams({ payment: result });
  if (orderId) query.set("order", orderId);
  return absoluteUrl(`/my-account/orders?${query.toString()}`);
}

function backendBase(): string {
  const explicit = process.env.WORDPRESS_REST_BASE?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const graphql = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  if (!graphql) throw new Error("NEXT_PUBLIC_WORDPRESS_API_URL is not configured");
  return `${new URL(graphql).origin}/wp-json`;
}

async function forward(
  request: NextRequest,
  context: { params: Promise<{ provider: string; orderId: string }> }
) {
  const { provider, orderId } = await context.params;
  const noStore = { "Cache-Control": "no-store, private" };

  if (!ALLOWED_PROVIDERS.has(provider) || !/^\d{1,12}$/.test(orderId)) {
    return NextResponse.redirect(resultUrl("cancelled"), { status: 303, headers: noStore });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`payment-callback:${ip}`, { max: 30, windowMs: 60 * 1000 }))) {
    return NextResponse.redirect(resultUrl("processing", orderId), { status: 303, headers: noStore });
  }

  try {
    const target = new URL(`${backendBase()}/btl/v1/pay/${provider}/${orderId}/callback`);
    request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));

    const init: RequestInit = {
      method: request.method,
      redirect: "manual",
      cache: "no-store",
      headers: {},
    };

    if (request.method === "POST") {
      const contentType = request.headers.get("content-type");
      init.body = await request.text();
      init.headers = contentType ? { "Content-Type": contentType } : {};
    }

    const response = await fetch(target, init);
    const location = response.headers.get("location");

    if (location) {
      const parsed = new URL(location, target);
      return NextResponse.redirect(absoluteUrl(`${parsed.pathname}${parsed.search}`), { status: 303, headers: noStore });
    }

    return NextResponse.redirect(resultUrl("failed", orderId), { status: 303, headers: noStore });
  } catch (error) {
    console.error("Payment callback proxy error:", error);
    return NextResponse.redirect(resultUrl("failed", orderId), { status: 303, headers: noStore });
  }
}

export const GET = forward;
export const POST = forward;