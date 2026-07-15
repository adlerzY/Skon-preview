import { NextResponse } from "next/server";
import { listAvatars } from "@/lib/avatars";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  const avatars = await listAvatars("users");
  const adminAvatars = user?.isStaff ? await listAvatars("admin") : [];

  return NextResponse.json({ avatars, adminAvatars });
}