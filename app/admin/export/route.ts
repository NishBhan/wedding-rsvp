import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthed } from "@/lib/admin-auth";
import { inviteTypeOf } from "@/lib/invites";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("submitted_at", { ascending: false });

  const { data: invites } = await supabase
    .from("invites")
    .select("id, partner_name, plus_one_allowed");
  const inviteById = new Map((invites ?? []).map((i) => [i.id, i]));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "Name",
    "Attending",
    "Plus One",
    "Plus One Name",
    "Partner Name",
    "Partner Attending",
    "Invite Type",
    "Submitted At",
  ];

  const rows = (data ?? []).map((r) => {
    const invite = r.invite_id ? inviteById.get(r.invite_id) : undefined;
    return [
      r.name,
      r.attending ? "Yes" : "No",
      r.plus_one ? "Yes" : "No",
      r.plus_one_name ?? "",
      r.partner_name ?? "",
      r.partner_attending === null || r.partner_attending === undefined
        ? ""
        : r.partner_attending
          ? "Yes"
          : "No",
      invite ? inviteTypeOf(invite) : "shared link",
      r.submitted_at,
    ]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="rsvps-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
