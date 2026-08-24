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
    <html
      lang="en"
      className={`${cormorant.variable} ${italiana.variable} ${petitFormalScript.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
