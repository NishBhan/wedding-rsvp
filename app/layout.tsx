import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

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

const siteUrl = "https://wedding-rsvp-nish-wout.vercel.app";

export const metadata: Metadata = {
  title: "FishfoundherWater| Wedding",
  description: "Everything you need for Nishtha & Wouter's wedding - 14-15th November 2027",
  openGraph: {
    title: "FishfoundherWater| Wedding",
    description: "Everything you need for Nishtha & Wouter's wedding - 14-15th November 2027",
    url: siteUrl,
    siteName: "Nishtha & Wouter",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Nishtha & Wouter monogram",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FishfoundherWater| Wedding",
    description: "Everything you need for Nishtha & Wouter's wedding - 14-15th November 2027",
    images: [`${siteUrl}/og-image.png`],
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
