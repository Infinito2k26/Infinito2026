// Display-only summary of an event's fee structure — never used to compute
// the actual charge, which is always server-side (RegistrationsService).
interface EventFeeFields {
    feeStructure: "FLAT" | "PER_HEAD" | "GENDER_BASED";
    feeFlat: string | number | null;
    feePerHead: string | number | null;
    feeMale: string | number | null;
    feeFemale: string | number | null;
}

function formatInr(amount: string | number | null): string {
    const value = Number(amount ?? 0);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatFeeSummary(event: EventFeeFields): string {
    switch (event.feeStructure) {
        case "FLAT":
            return formatInr(event.feeFlat);
        case "PER_HEAD":
            return `${formatInr(event.feePerHead)} / head`;
        case "GENDER_BASED":
            return `${formatInr(event.feeMale)} (Men) · ${formatInr(event.feeFemale)} (Women)`;
        default:
            return "—";
    }
}
