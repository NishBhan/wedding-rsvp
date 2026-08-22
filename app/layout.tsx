import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Nishtha & Wouter | RSVP",
  description: "RSVP for the wedding of Nishtha and Wouter, 14-15 November 2027",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${ebGaramond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
