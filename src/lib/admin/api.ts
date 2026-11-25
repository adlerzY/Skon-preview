import "server-only";
import { NextResponse } from "next/server";
import { adminAction, assertAdminApi, AdminAccessError } from "./server";
import type { AdminPermission } from "./permissions";
import { RequestBodyError } from "@/lib/requestBody";

const NO_STORE = { "Cache-Control": "private, no-store" };

export function adminJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function adminFail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export function safeMessage(raw: string | null | undefined, fallback: string): string {
  const text = String(raw ?? "").trim();
  return text && text.length <= 220 && /[\u0600-\u06FF]/.test(text) ? text : fallback;
}

export function positiveInt(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export async function runAdmin(
  permission: AdminPermission | undefined,
  fallback: string,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    await assertAdminApi(permission);
    return await handler();
  } catch (error) {
    if (error instanceof AdminAccessError) return adminFail(error.message, error.status);
    if (error instanceof RequestBodyError) return adminFail(error.message, error.status);
    console.error(fallback, error);
    return adminFail(fallback, 500);
  }
}

export async function runMutation(
  query: string,
  variables: Record<string, unknown>,
  resultKey: string,
  fallback: string
): Promise<Response> {
  const { data, errorMessage } = await adminAction(query, variables);

  if (!data?.[resultKey]) {
    if (String(errorMessage ?? "").toLowerCase().includes("btl_session_denied")) {
      return adminFail("نشست شما معتبر نیست؛ دوباره وارد شوید", 401);
    }
    return adminFail(safeMessage(errorMessage, fallback), 409);
  }

  return adminJson(data);
}