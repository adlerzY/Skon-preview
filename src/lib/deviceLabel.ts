export function detectDeviceLabel(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("android")) return "اندروید";
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
  if (ua.includes("windows")) return "ویندوز";
  if (ua.includes("mac os")) return "مک";
  if (ua.includes("linux")) return "لینوکس";
  return "دستگاه نامشخص";
}