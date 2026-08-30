"use client";

import type { EventSubOption } from "@/lib/types/event";
import type { SubOptionSelection } from "@/lib/types/registration";

import styles from "./SubOptionPicker.module.css";

interface SubOptionPickerProps {
    subOptions: EventSubOption[];
    selections: SubOptionSelection[];
    onChange: (selections: SubOptionSelection[]) => void;
}

// Mirrors RegistrationsService.maxSelectionsFor: the cap for a SubOptionType
// is the highest maxSelectionsPerReg among that type's rows, since the field
// is stamped identically across every row of the same type.
function capFor(subOptions: EventSubOption[], type: "INDIVIDUAL" | "RELAY"): number | null {
    const rows = subOptions.filter((s) => s.type === type);
    if (rows.length === 0) return null;
    return Math.max(...rows.map((s) => s.maxSelectionsPerReg));
}

export default function SubOptionPicker({ subOptions, selections, onChange }: SubOptionPickerProps) {
    if (subOptions.length === 0) {
        return null;
    }

    const individualOptions = subOptions.filter((s) => s.type === "INDIVIDUAL");
    const relayOptions = subOptions.filter((s) => s.type === "RELAY");
    const individualCap = capFor(subOptions, "INDIVIDUAL");
    const relayCap = capFor(subOptions, "RELAY");

    const selectedIds = new Set(selections.map((s) => s.subOptionId));
    const individualCount = selections.filter((s) =>
        individualOptions.some((o) => o.id === s.subOptionId),
    ).length;
    const relayCount = selections.filter((s) => relayOptions.some((o) => o.id === s.subOptionId)).length;

    const toggle = (subOptionId: string, isRelay: boolean) => {
        if (selectedIds.has(subOptionId)) {
            onChange(selections.filter((s) => s.subOptionId !== subOptionId));
            return;
        }
        const atCap = isRelay
            ? relayCap != null && relayCount >= relayCap
            : individualCap != null && individualCount >= individualCap;
        if (atCap) return;
        onChange([...selections, { subOptionId, relayMembers: isRelay ? [] : undefined }]);
    };

    const setRelayMembers = (subOptionId: string, raw: string) => {
        const relayMembers = raw
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);
        onChange(
            selections.map((s) => (s.subOptionId === subOptionId ? { ...s, relayMembers } : s)),
        );
    };

    return (
        <div className={styles.container}>
            {individualOptions.length > 0 && (
                <div className={styles.group}>
                    <p className={styles.groupLabel}>
                        Individual events{individualCap != null ? ` (choose up to ${individualCap})` : ""}
                    </p>
                    <div className={styles.optionList}>
                        {individualOptions.map((opt) => (
                            <label key={opt.id} className={styles.optionRow}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(opt.id)}
                                    onChange={() => toggle(opt.id, false)}
                                    disabled={
                                        !selectedIds.has(opt.id) &&
                                        individualCap != null &&
                                        individualCount >= individualCap
                                    }
                                />
                                {opt.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {relayOptions.length > 0 && (
                <div className={styles.group}>
                    <p className={styles.groupLabel}>
                        Relay events{relayCap != null ? ` (choose up to ${relayCap})` : ""}
                    </p>
                    <div className={styles.optionList}>
                        {relayOptions.map((opt) => {
                            const selection = selections.find((s) => s.subOptionId === opt.id);
                            return (
                                <div key={opt.id} className={styles.relayRow}>
                                    <label className={styles.optionRow}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(opt.id)}
                                            onChange={() => toggle(opt.id, true)}
                                            disabled={
                                                !selectedIds.has(opt.id) &&
                                                relayCap != null &&
                                                relayCount >= relayCap
                                            }
                                        />
                                        {opt.name}
                                    </label>
                                    {selection && (
                                        <input
                                            type="text"
                                            className={styles.relayInput}
                                            placeholder="Teammate names, comma-separated"
                                            value={(selection.relayMembers ?? []).join(", ")}
                                            onChange={(e) => setRelayMembers(opt.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
