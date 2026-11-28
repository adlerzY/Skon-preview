export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  "on-hold": "در انتظار اقدام",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
  refunded: "مستردشده",
  failed: "ناموفق",
};

export const orderStatusTone = (status: string): StatusTone =>
  status === "completed"
    ? "success"
    : status === "cancelled" || status === "failed"
    ? "danger"
    : status === "processing"
    ? "info"
    : "warning";

export const PAYMENT_LABELS: Record<string, string> = {
  paid: "پرداخت‌شده",
  unpaid: "پرداخت‌نشده",
};

export const FULFILLMENT_LABELS: Record<string, string> = {
  queued: "در صف",
  processing: "در حال تکمیل",
  completed: "تکمیل کامل",
};

export const fulfillmentTone = (status: string): StatusTone =>
  status === "completed" ? "success" : status === "processing" ? "info" : "neutral";

export const DELIVERY_LABELS: Record<string, string> = {
  direct: "مستقیم",
  gift: "گیفت",
  code: "کد",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "باز",
  claimed: "در اختیار ادمین",
  waiting_user: "در انتظار کاربر",
  waiting_staff: "در انتظار پشتیبانی",
  resolved: "حل‌شده",
  closed: "بسته‌شده",
};

export const ticketStatusTone = (status: string): StatusTone =>
  status === "resolved" || status === "closed" ? "success" : status === "open" ? "warning" : "info";

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  low: "کم",
  normal: "عادی",
  high: "زیاد",
  urgent: "فوری",
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  publish: "منتشرشده",
  draft: "پیش‌نویس",
  private: "خصوصی",
  pending: "در انتظار بررسی",
};

export const productStatusTone = (status: string): StatusTone =>
  status === "publish" ? "success" : status === "pending" ? "warning" : "neutral";

export const CDKEY_STATUS_LABELS: Record<string, string> = {
  available: "موجود",
  reserved: "رزروشده",
  used: "مصرف‌شده",
  duplicate: "تکراری",
  decrypt_failed: "خطای رمزگشایی",
  failed: "ناموفق",
};

export const cdkeyStatusTone = (status: string): StatusTone =>
  status === "available" ? "success" : status === "failed" || status === "decrypt_failed" ? "danger" : "neutral";