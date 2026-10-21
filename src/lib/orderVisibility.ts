export const CANCELLED_ORDER_VISIBLE_DAYS = 7;

const VISIBLE_WINDOW_MS = CANCELLED_ORDER_VISIBLE_DAYS * 24 * 60 * 60 * 1000;

export function keepVisibleOrder(order: { status?: string; date?: string; cancelledAt?: string }): boolean {
  if (!["CANCELLED", "FAILED"].includes(String(order.status))) return true;
  const reference = order.cancelledAt
    ? new Date(order.cancelledAt).getTime()
    : order.date
      ? new Date(order.date).getTime()
      : 0;
  return reference > 0 && Date.now() - reference <= VISIBLE_WINDOW_MS;
}