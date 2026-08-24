import type { Metadata } from "next";
import { Cormorant_Garamond, Italiana, Petit_Formal_Script } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-heading",
});

const italiana = Italiana({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-label",
});

const petitFormalScript = Petit_Formal_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
});

const siteUrl = "https://wedding-rsvp-three-rouge.vercel.app";

export const metadata: Metadata = {
  title: "Nishtha & Wouter | RSVP",
  description: "RSVP for the wedding of Nishtha and Wouter, 14-15 November 2027",
  openGraph: {
    title: "Nishtha & Wouter | RSVP",
    description: "We'd love to know if you can join us — 14–15 November 2027, Bengaluru.",
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
    title: "Nishtha & Wouter | RSVP",
    description: "We'd love to know if you can join us — 14–15 November 2027, Bengaluru.",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${italiana.variable} ${petitFormalScript.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
