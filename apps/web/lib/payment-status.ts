// Shared display mapping for Payment.status / MerchOrder.paymentStatus
// (both use the same PaymentStatus enum) — keeps "paid" and "verified"
// wording consistent everywhere a registrant or buyer can see their own
// payment state (register flow, Teams, My Orders).

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export interface PaymentStatusDisplay {
  label: string;
  variant: BadgeVariant;
}

export function describePaymentStatus(
  paymentStatus: string | null | undefined,
): PaymentStatusDisplay {
  switch (paymentStatus) {
    case "RECONCILIATION_PENDING":
      return { label: "Paid — Awaiting Verification", variant: "warning" };
    case "SUCCESS":
      return { label: "Verified", variant: "success" };
    case "FAILED":
      return { label: "Payment Rejected", variant: "danger" };
    case "REFUNDED":
      return { label: "Refunded", variant: "default" };
    case "INITIATED":
    default:
      return { label: "Payment Pending", variant: "warning" };
  }
}
