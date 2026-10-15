import { icsResponse, weddingIcs } from "@/lib/calendar";

export function GET() {
  return icsResponse(weddingIcs(), "Nishtha-and-Wouter-wedding.ics");
}
