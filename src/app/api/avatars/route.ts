import { NextResponse } from "next/server";
import { listAvatars } from "@/lib/avatars";

export async function GET() {
  const avatars = await listAvatars();
  return NextResponse.json({ avatars });
}