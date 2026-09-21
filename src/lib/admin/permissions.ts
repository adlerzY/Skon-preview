export const ADMIN_PERMISSIONS = {
  ORDERS_READ: "orders.read",
  ORDERS_WRITE: "orders.write",
  ORDERS_FULFILL: "orders.fulfill",
  TICKETS_READ: "tickets.read",
  TICKETS_WRITE: "tickets.write",
  TICKETS_CLAIM: "tickets.claim",
  REVIEWS_MODERATE: "reviews.moderate",
  CDKEYS_READ: "cdkeys.read",
  CDKEYS_WRITE: "cdkeys.write",
  CDKEYS_REVEAL: "cdkeys.reveal",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
