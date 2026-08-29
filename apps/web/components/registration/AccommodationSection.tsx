"use client";

import Input from "@/components/ui/input";

import styles from "./AccommodationSection.module.css";

export interface AccommodationValue {
    accommodationOpted?: boolean;
    accommodationDays?: number;
    accommodationHeadcount?: number;
    messOnlyOpted?: boolean;
    messOnlyHeadcount?: number;
}

interface AccommodationSectionProps {
    /** Individual events fix headcount at 1 (never asked); team events ask it. */
    isTeamEvent: boolean;
    value: AccommodationValue;
    onChange: (value: AccommodationValue) => void;
}

type Package = "FULL" | "MESS_ONLY";

// This UI only ever sends exactly one of accommodationOpted/messOnlyOpted as
// true — the backend supports stacking both across different subsets of a
// team, but splitting headcount that way isn't offered here (product
// decision: single toggle + package choice, not two independent toggles).
export default function AccommodationSection({
    isTeamEvent,
    value,
    onChange,
}: AccommodationSectionProps) {
    const needsAccommodation = Boolean(value.accommodationOpted || value.messOnlyOpted);
    const selectedPackage: Package = value.messOnlyOpted ? "MESS_ONLY" : "FULL";
    const headcount = value.accommodationOpted
        ? value.accommodationHeadcount
        : value.messOnlyHeadcount;

    const setNeedsAccommodation = (needed: boolean) => {
        if (!needed) {
            onChange({});
            return;
        }
        onChange({
            accommodationOpted: true,
            accommodationDays: value.accommodationDays,
            accommodationHeadcount: isTeamEvent ? undefined : 1,
        });
    };

    const setPackage = (pkg: Package) => {
        const nextHeadcount = isTeamEvent ? headcount : 1;
        onChange(
            pkg === "FULL"
                ? {
                      accommodationOpted: true,
                      accommodationDays: value.accommodationDays,
                      accommodationHeadcount: nextHeadcount,
                  }
                : {
                      messOnlyOpted: true,
                      accommodationDays: value.accommodationDays,
                      messOnlyHeadcount: nextHeadcount,
                  },
        );
    };

    const setDays = (days: number | undefined) => {
        onChange({ ...value, accommodationDays: days });
    };

    const setHeadcount = (count: number | undefined) => {
        onChange(
            selectedPackage === "FULL"
                ? { ...value, accommodationHeadcount: count }
                : { ...value, messOnlyHeadcount: count },
        );
    };

    return (
        <div className={styles.container}>
            <label className={styles.toggleRow}>
                <input
                    type="checkbox"
                    checked={needsAccommodation}
                    onChange={(e) => setNeedsAccommodation(e.target.checked)}
                />
                Need accommodation?
            </label>

            {needsAccommodation && (
                <div className={styles.details}>
                    <div className={styles.packageChoice}>
                        <label className={styles.radioRow}>
                            <input
                                type="radio"
                                name="accommodation-package"
                                checked={selectedPackage === "FULL"}
                                onChange={() => setPackage("FULL")}
                            />
                            Full package (lodging + mess)
                        </label>
                        <label className={styles.radioRow}>
                            <input
                                type="radio"
                                name="accommodation-package"
                                checked={selectedPackage === "MESS_ONLY"}
                                onChange={() => setPackage("MESS_ONLY")}
                            />
                            Mess only
                        </label>
                    </div>

                    <Input
                        id="accommodationDays"
                        label="Number of days"
                        type="number"
                        min={1}
                        value={value.accommodationDays ?? ""}
                        onChange={(e) =>
                            setDays(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                    />

                    {isTeamEvent && (
                        <Input
                            id="accommodationHeadcount"
                            label="Number of team members"
                            type="number"
                            min={1}
                            value={headcount ?? ""}
                            onChange={(e) =>
                                setHeadcount(e.target.value === "" ? undefined : Number(e.target.value))
                            }
                        />
                    )}
                </div>
            )}
        </div>
    );
}
