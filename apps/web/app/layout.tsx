import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infinito 2K26",
  description: "IIT Patna's annual sports fest — browse events, register your team, and get your entry credential.",
  openGraph: {
    title: "Infinito 2K26",
    description: "IIT Patna's annual sports fest — browse events, register your team, and get your entry credential.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Infinito 2K26",
    description: "IIT Patna's annual sports fest — browse events, register your team, and get your entry credential.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <div id="modal-root" />
      </body>
    </html>
  );
}