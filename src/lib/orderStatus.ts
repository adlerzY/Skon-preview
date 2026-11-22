export type StatusTone = "blue" | "sabz" | "zard" | "red" | "neutral";

export interface OrderStatusInput {
  status?: string | null;
  paymentState?: string | null;
  fulfillmentSummary?: string | null;
}

export interface OrderDisplay {
  label: string;
  tone: StatusTone;
  isPaid: boolean;
  isAwaiting: boolean;
  itemText: string;
  itemTone: StatusTone;
}

export function resolveOrderDisplay(order: OrderStatusInput): OrderDisplay {
  const status = String(order.status ?? "").toUpperCase();
  const payment = String(order.paymentState ?? "");
  const summary = String(order.fulfillmentSummary ?? "");

  if (status === "COMPLETED") {
    return { label: "تکمیل‌شده", tone: "sabz", isPaid: true, isAwaiting: false, itemText: "", itemTone: "sabz" };
  }

  if (status === "PROCESSING") {
    if (summary === "completed") {
      return { label: "تحویل داده شد", tone: "sabz", isPaid: true, isAwaiting: false, itemText: "", itemTone: "sabz" };
    }
    if (summary === "processing") {
      return { label: "در حال تحویل", tone: "blue", isPaid: true, isAwaiting: false, itemText: "", itemTone: "blue" };
    }
    return { label: "پرداخت شد؛ در صف تحویل", tone: "blue", isPaid: true, isAwaiting: false, itemText: "", itemTone: "blue" };
  }

  if (status === "PENDING" || status === "ON_HOLD" || status === "CHECKOUT_DRAFT") {
    if (payment === "verified") {
      return {
        label: "پرداخت تأیید شد؛ در حال ثبت سفارش",
        tone: "blue",
        isPaid: false,
        isAwaiting: true,
        itemText: "در حال ثبت سفارش...",
        itemTone: "blue",
      };
    }
    if (payment === "review") {
      return {
        label: "پرداخت تأیید شد؛ در حال بررسی",
        tone: "zard",
        isPaid: false,
        isAwaiting: false,
        itemText: "در حال بررسی پشتیبانی",
        itemTone: "zard",
      };
    }
    if (status === "ON_HOLD") {
      return { label: "در انتظار بررسی", tone: "zard", isPaid: false, isAwaiting: false, itemText: "در انتظار بررسی", itemTone: "zard" };
    }
    return { label: "در انتظار پرداخت", tone: "zard", isPaid: false, isAwaiting: false, itemText: "منتظر پرداخت", itemTone: "zard" };
  }

  if (status === "CANCELLED") {
    return { label: "لغو‌شده", tone: "red", isPaid: false, isAwaiting: false, itemText: "سفارش لغو شده", itemTone: "neutral" };
  }

  if (status === "FAILED") {
    return { label: "ناموفق", tone: "red", isPaid: false, isAwaiting: false, itemText: "پرداخت ناموفق", itemTone: "neutral" };
  }

  if (status === "REFUNDED") {
    return { label: "بازگشت وجه", tone: "neutral", isPaid: false, isAwaiting: false, itemText: "مسترد شده", itemTone: "neutral" };
  }

  return { label: status || "نامشخص", tone: "neutral", isPaid: false, isAwaiting: false, itemText: "—", itemTone: "neutral" };
}

interface PollableOrder extends OrderStatusInput {
  lineItems?: {
    nodes?: Array<{ cdkeyReady?: boolean; metaData?: Array<{ key: string; value: string }> }>;
  };
}

export function orderNeedsPolling(order: PollableOrder): boolean {
  if (resolveOrderDisplay(order).isAwaiting) return true;
  if (String(order.status ?? "").toUpperCase() !== "PROCESSING") return false;
  return (order.lineItems?.nodes ?? []).some(
    (item) => item.metaData?.find((meta) => meta.key === "روش تحویل")?.value === "code" && !item.cdkeyReady
  );
}