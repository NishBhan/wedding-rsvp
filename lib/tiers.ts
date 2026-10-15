// Invite tiers for sending in batches: T1 first, then T2, and so on.
// Stored as invites.tier (null = no tier yet).
export const TIERS = [1, 2, 3, 4, 5, 6] as const;

export const tierLabel = (tier: number | null | undefined) => (tier ? `T${tier}` : "No tier");

export function parseTier(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === "" || raw === undefined) return null;
  const n = Number(raw);
  return (TIERS as readonly number[]).includes(n) ? n : "invalid";
}
