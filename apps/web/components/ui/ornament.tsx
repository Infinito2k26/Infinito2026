import styles from "./ornament.module.css";

/**
 * The ornament vocabulary, taken from the key art.
 *
 * The art decorates with thin charcoal line work — valknut roundels, hanging
 * pendants, arrow rules — and terminates its bone sky against a ruined skyline.
 * Keeping those five shapes behind one component is what stops seven different
 * pages inventing seven different unicode glyphs.
 *
 * All variants are decorative and marked aria-hidden.
 */
export type OrnamentVariant =
  | "valknut"
  | "arrowRule"
  | "pendant"
  | "ridge"
  | "emberDivider";

type OrnamentProps = {
  variant: OrnamentVariant;
  /** Optional label rendered inside `arrowRule`. */
  label?: string;
  /** For `ridge`: the colour the section below it uses. Defaults to charcoal. */
  fill?: string;
  /** Flips `ridge` for a dark section terminating against a light one. */
  flip?: boolean;
  className?: string;
};

export default function Ornament({
  variant,
  label,
  fill,
  flip = false,
  className,
}: OrnamentProps) {
  const cls = [styles[variant], className].filter(Boolean).join(" ");

  if (variant === "valknut") {
    return (
      <svg
        className={cls}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="46" />
        <circle cx="50" cy="50" r="38" />
        <path d="M50 22 L34 52 L66 52 Z" />
        <path d="M38 40 L22 70 L54 70 Z" />
        <path d="M62 40 L46 70 L78 70 Z" />
      </svg>
    );
  }

  if (variant === "arrowRule") {
    return (
      <div className={cls} aria-hidden="true">
        <span className={styles.arrowLine} />
        {label ? <span className={styles.arrowLabel}>{label}</span> : null}
        <span className={styles.arrowLine} />
        <svg
          className={styles.arrowHead}
          viewBox="0 0 12 10"
          fill="currentColor"
        >
          <path d="M0 5 L9 0 L7 5 L9 10 Z" />
        </svg>
      </div>
    );
  }

  if (variant === "pendant") {
    return (
      <svg
        className={cls}
        viewBox="0 0 24 120"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        aria-hidden="true"
      >
        <path d="M12 0 V44" />
        <circle cx="12" cy="52" r="7" />
        <path d="M12 45 L7 52 L12 59 L17 52 Z" />
        <path d="M12 60 V92" />
        <path d="M12 104 L6 92 H18 Z" />
        <path d="M12 104 V118" />
      </svg>
    );
  }

  if (variant === "ridge") {
    return (
      <svg
        className={cls}
        viewBox="0 0 1200 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ transform: flip ? "scaleY(-1)" : undefined }}
      >
        <path
          d="M0 90 L0 62 L38 62 L38 44 L62 44 L62 66 L104 66 L104 38 L128 30 L152 38 L152 60 L196 60 L196 48 L222 48 L222 70 L266 70 L266 42 L290 34 L314 42 L314 64 L360 64 L360 52 L392 52 L392 68 L436 68 L436 40 L460 32 L486 40 L486 62 L534 62 L534 50 L566 50 L566 70 L612 70 L612 44 L640 36 L666 44 L666 66 L714 66 L714 54 L744 54 L744 72 L790 72 L790 46 L816 38 L842 46 L842 64 L890 64 L890 52 L920 52 L920 70 L966 70 L966 42 L992 34 L1018 42 L1018 62 L1064 62 L1064 50 L1096 50 L1096 68 L1142 68 L1142 46 L1168 46 L1168 60 L1200 60 L1200 90 Z"
          fill={fill ?? "var(--char-900)"}
        />
      </svg>
    );
  }

  return <span className={cls} aria-hidden="true" />;
}
