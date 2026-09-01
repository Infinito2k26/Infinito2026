"use client";

import Input from "@/components/ui/input";
import type { CustomFieldDef } from "@/lib/types/event";

import styles from "./CustomFieldRenderer.module.css";

interface CustomFieldRendererProps {
    /** Full customFieldsDef from the event — filtered here to TEAM scope, the
     * only scope RegistrationsService validates against Registration.customData. */
    fields: CustomFieldDef[];
    values: Record<string, unknown>;
    errors?: Record<string, string>;
    onChange: (label: string, value: unknown) => void;
}

export default function CustomFieldRenderer({
    fields,
    values,
    errors,
    onChange,
}: CustomFieldRendererProps) {
    const teamFields = fields.filter((f) => f.scope === "TEAM");

    if (teamFields.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            {teamFields.map((field) => {
                const value = values[field.label];
                const error = errors?.[field.label];

                if (field.inputType === "SELECT") {
                    return (
                        <div key={field.label} className={styles.selectWrapper}>
                            <label className={styles.label} htmlFor={field.label}>
                                {field.label}
                                {field.required && <span className={styles.required}> *</span>}
                            </label>
                            <select
                                id={field.label}
                                className={styles.select}
                                value={(value as string) ?? ""}
                                onChange={(e) => onChange(field.label, e.target.value)}
                            >
                                <option value="" disabled>
                                    Select an option
                                </option>
                                {(field.options ?? []).map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            {error && <span className={styles.error}>{error}</span>}
                        </div>
                    );
                }

                // FILE fields are stored as a plain string (RegistrationsService only
                // checks typeof === 'string') — there's no generic custom-field
                // uploader in scope, so this expects the user to paste a link.
                const inputType = field.inputType === "NUMBER" ? "number" : "text";
                const hint = field.inputType === "FILE" ? "Paste a link to the file" : undefined;

                return (
                    <Input
                        key={field.label}
                        id={field.label}
                        label={`${field.label}${field.required ? " *" : ""}`}
                        type={inputType}
                        hint={hint}
                        error={error}
                        value={(value as string | number | undefined) ?? ""}
                        onChange={(e) =>
                            onChange(
                                field.label,
                                field.inputType === "NUMBER"
                                    ? e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value)
                                    : e.target.value,
                            )
                        }
                    />
                );
            })}
        </div>
    );
}
