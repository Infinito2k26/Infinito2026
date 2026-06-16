import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infinito 2K26",
  description: "IIT Patna annual sports fest platform",
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
      </body>
    </html>
  );
}