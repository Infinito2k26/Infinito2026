import type { Metadata } from "next";
import { Grenze_Gotisch, Cinzel, Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

/**
 * The key art pairs a heavy blackletter title with chiselled roman caps for its
 * metadata, so the type system mirrors that: blackletter for display, Cinzel for
 * labels and eyebrows, Inter for everything that has to be read at length.
 *
 * Grenze Gotisch is used rather than the teaser site's UnifrakturCook, which is
 * effectively unreadable below ~40px.
 */
const display = Grenze_Gotisch({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  display: "swap",
  variable: "--font-display",
});

const caps = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-caps",
});

const ui = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

const sport = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-sport",
});

const DESCRIPTION =
  "Ruins of Ragnarok — the 11th edition of Infinito, IIT Patna's annual sports fest. 17 sports across three days, 9–11 October 2026. Browse events, register your team, and get your entry credential.";

export const metadata: Metadata = {
  title: {
    default: "Infinito 2026 — Ruins of Ragnarok",
    template: "%s · Infinito 2026",
  },
  description: DESCRIPTION,
  applicationName: "Infinito 2026",
  keywords: [
    "Infinito",
    "Infinito 2026",
    "IIT Patna",
    "sports fest",
    "Ruins of Ragnarok",
  ],
  openGraph: {
    title: "Infinito 2026 — Ruins of Ragnarok",
    description: DESCRIPTION,
    siteName: "Infinito 2026",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinito 2026 — Ruins of Ragnarok",
    description: DESCRIPTION,
  },
};

/* Bone, so the browser chrome and the overscroll gutter match the page. */
export const viewport = {
  themeColor: "#f5ede2",
  colorScheme: "light",
};

export default function RootLayout({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ponytail: unused during the maintenance takeover below, restore {children} to bring the site back
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${caps.variable} ${ui.variable} ${sport.variable}`}
    >
      <body>
        {/* ponytail: sitewide maintenance takeover, remove this block + restore {children} to bring the site back */}
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            textAlign: "center",
            padding: "2rem",
            background: "#f5ede2",
          }}
        >
          <h1 className="font-display" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", maxWidth: "40rem" }}>
            Website is under Maintenance, all operations are shifted to Google Forms
          </h1>
          <a
            href="https://jolly-figolla-671c6f.netlify.app"
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              background: "#1a1a1a",
              color: "#f5ede2",
              textDecoration: "none",
              fontFamily: "var(--font-caps)",
              letterSpacing: "0.05em",
            }}
          >
            Continue to Google Forms
          </a>
        </main>
        <div id="modal-root" />
      </body>
    </html>
  );
}
