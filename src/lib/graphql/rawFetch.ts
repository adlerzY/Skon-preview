import { cookies, headers } from "next/headers";
import { createHmac } from "crypto";
import { SESSION_ID_COOKIE } from "@/lib/auth/constants";
import { getClientIp } from "@/lib/rateLimit";
import "server-only";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const INTERNAL_WP_GRAPHQL_URL = process.env.INTERNAL_WORDPRESS_API_URL;
const FALLBACK_LOCAL_URL = "http://tazavesh.local/graphql";
const REQUEST_TIMEOUT_MS = Number(process.env.GRAPHQL_REQUEST_TIMEOUT_MS) || 12_000;

function resolveEndpoint(): { url: string; hostHeader?: string } {
  const publicUrl = WP_GRAPHQL_URL || (process.env.NODE_ENV === "production" ? "" : FALLBACK_LOCAL_URL);
  if (!publicUrl) throw new Error("NEXT_PUBLIC_WORDPRESS_API_URL is not configured in production");

  if (!INTERNAL_WP_GRAPHQL_URL) {
    return { url: publicUrl };
  }

  let hostHeader: string | undefined;
  try {
    hostHeader = new URL(publicUrl).host;
  } catch {
    hostHeader = undefined;
  }

  return { url: INTERNAL_WP_GRAPHQL_URL, hostHeader };
}

async function resolveClientIpHeaders(): Promise<Record<string, string>> {
  const secret = process.env.SESSION_BINDING_SECRET;
  if (!secret) return {};

  try {
    const incoming = await headers();
    const ip = getClientIp({ headers: incoming } as unknown as Request);
    if (!ip || ip === "unknown") return {};

    const proof = createHmac("sha256", secret).update(`client-ip.${ip}`).digest("hex");
    return { "X-BTL-Client-IP": ip, "X-BTL-Client-IP-Proof": proof };
  } catch {
    return {};
  }
}

export async function fetchGraphQLWithErrors(
  query: string,
  variables: Record<string, unknown> = {},
  authToken?: string,
  sessionId?: string,
  bootstrapProof?: string,
  previousAuthToken?: string
): Promise<{ data: any; errorMessage: string | null }> {
  const { url: endpointUrl, hostHeader } = resolveEndpoint();
  let boundSessionId = sessionId;
  const needsSessionBinding = Boolean(authToken || bootstrapProof || previousAuthToken || sessionId);
  if (needsSessionBinding) {
    try {
      const cookieStore = await cookies();
      if (!boundSessionId) boundSessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
    } catch {}
  }
  const clientIpHeaders = await resolveClientIpHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(boundSessionId ? { "X-BTL-Session-ID": boundSessionId } : {}),
        ...(bootstrapProof ? { "X-BTL-Session-Bootstrap": bootstrapProof } : {}),
        ...(previousAuthToken ? { "X-BTL-Previous-Authorization": `Bearer ${previousAuthToken}` } : {}),
        ...(hostHeader ? { Host: hostHeader } : {}),
        ...clientIpHeaders,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();
    return { data: json?.data ?? null, errorMessage: json?.errors?.[0]?.message ?? null };
  } catch (error) {
    const isAbort = (error as Error)?.name === "AbortError";
    if (isAbort) {
      console.error(`GraphQL request timed out after ${REQUEST_TIMEOUT_MS}ms — query preview:`, query.trim().slice(0, 160));
      return { data: null, errorMessage: "خطا در ارتباط با سرور، دوباره تلاش کنید" };
    }
    console.error("GraphQL request error:", error);
    return { data: null, errorMessage: null };
  } finally {
    clearTimeout(timeoutId);
  }
}