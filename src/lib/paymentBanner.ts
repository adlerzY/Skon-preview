import type { PaymentResult } from "@/components/account/PaymentResultBanner";

export interface PaymentBannerState {
  result: PaymentResult;
  polling: boolean;
}

const KNOWN_RESULTS: PaymentResult[] = ["success", "processing", "failed", "cancelled"];

export function resolvePaymentBanner(
  result: string | undefined,
  orderId: number | undefined,
  orders: any[]
): PaymentBannerState | null {
  if (!result || !KNOWN_RESULTS.includes(result as PaymentResult)) return null;

  const order = orderId ? orders.find((item) => Number(item.databaseId) === orderId) : undefined;
  const status = String(order?.status ?? "").toUpperCase();

  if (status === "PROCESSING" || status === "COMPLETED") {
    const waitingForCode = (order?.lineItems?.nodes ?? []).some(
      (item: any) =>
        item.metaData?.find((meta: any) => meta.key === "روش تحویل")?.value === "code" && !item.cdkeyReady
    );
    return { result: "success", polling: waitingForCode };
  }

  if (result === "success" || result === "processing") {
    return {
      result: "processing",
      polling: Boolean(order) && (status === "PENDING" || status === "ON_HOLD"),
    };
  }

  return { result: result as PaymentResult, polling: false };
}