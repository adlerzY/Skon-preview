import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string | null | undefined, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const params = new URLSearchParams();
    params.set("secret", secretKey);
    params.set("response", token);
    if (remoteIp && remoteIp !== "unknown") {
      params.set("remoteip", remoteIp);
    }

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return Boolean(data?.success);
  } catch (error) {
    console.error("Turnstile verify error:", error);
    return false;
  }
}