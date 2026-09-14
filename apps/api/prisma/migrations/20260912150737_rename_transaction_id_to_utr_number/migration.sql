-- Rename "transactionId" to "utrNumber" on Payment and MerchOrder.
-- Renamed (not dropped/re-added) so existing values are preserved —
-- UPI payments are proven by a UTR / reference number, not a "transaction ID".
ALTER TABLE "Payment" RENAME COLUMN "transactionId" TO "utrNumber";
ALTER TABLE "MerchOrder" RENAME COLUMN "transactionId" TO "utrNumber";
