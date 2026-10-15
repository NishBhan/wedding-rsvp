import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { OG_IMAGE, SITE_URL } from "@/lib/site";

// Cormorant Garamond only, per the approved design refresh — no second
// display face. Weights/styles cover everything the design uses: light
// numerals, regular body copy, medium headings/labels, and the italic
// ampersand and fine print.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-heading",
});

const siteUrl = SITE_URL.replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Nishtha & Wouter | 14–15 November 2027",
  description: "Nishtha & Wouter's wedding, 14–15 November 2027, Bengaluru, India.",
  openGraph: {
    title: "Nishtha & Wouter | 14–15 November 2027",
    description: "Nishtha & Wouter's wedding, 14–15 November 2027, Bengaluru, India.",
    url: siteUrl,
    siteName: "Nishtha & Wouter",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nishtha & Wouter | 14–15 November 2027",
    description: "Nishtha & Wouter's wedding, 14–15 November 2027, Bengaluru, India.",
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cormorant.variable}>
      <body>{children}</body>
    </html>
  );
}
