import type { Metadata } from "next";
import { Grenze_Gotisch, Cinzel, Inter } from "next/font/google";
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
  weight: ["500", "600", "700"],
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
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${caps.variable} ${ui.variable}`}
    >
      <body>
        {children}
        <div id="modal-root" />
      </body>
    </html>
  );
}
