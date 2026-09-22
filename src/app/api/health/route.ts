import { NextResponse } from "next/server";
import { getRateLimitHealth } from "@/lib/rateLimit";

export async function GET() {
  const rateLimit = getRateLimitHealth();
  const required = {
    wordpressUrl: Boolean(process.env.NEXT_PUBLIC_WORDPRESS_API_URL),
    sessionSecret: (process.env.SESSION_BINDING_SECRET?.length ?? 0) >= 32,
    revalidationSecret: (process.env.REVALIDATION_SECRET?.length ?? 0) >= 32,
    adminSharedSecret: (process.env.BTL_ADMIN_GRAPHQL_SHARED_SECRET?.length ?? 0) >= 32,
  };
  const ok = (!rateLimit.production
    || (rateLimit.distributedConfigured || rateLimit.memoryFallbackAllowed)
      && rateLimit.proxyTrustConfigured)
    && Object.values(required).every(Boolean);
  return NextResponse.json(
    {
      ok,
      dependencies: required,
      rateLimit: {
        distributedConfigured: rateLimit.distributedConfigured,
        production: rateLimit.production,
        memoryFallbackAllowed: rateLimit.memoryFallbackAllowed,
        proxyTrustConfigured: rateLimit.proxyTrustConfigured,
      },
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
