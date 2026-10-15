import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthed } from "@/lib/admin-auth";
import { inviteTypeOf } from "@/lib/invites";

function csvEscape(raw: string) {
  // Guest-typed names starting with = + - @ (or a tab/CR) would run as a
  // formula when the CSV is opened in Excel or Google Sheets. A leading
  // apostrophe makes the spreadsheet treat them as plain text.
  const value = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
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
    .select("id, guest_name, partner_name, plus_one_allowed");
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
    // Names as they are now on the invite (see app/admin/page.tsx).
    return [
      invite?.guest_name || r.name,
      r.attending ? "Yes" : "No",
      r.plus_one ? "Yes" : "No",
      r.plus_one_name ?? "",
      invite?.partner_name || r.partner_name || "",
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
