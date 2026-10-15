import type { Metadata } from "next";

// RSVP pages, and above all personal invite links, should never appear in
// search results, even if a link ends up somewhere public.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RsvpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
