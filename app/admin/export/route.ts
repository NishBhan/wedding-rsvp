import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthed } from "@/lib/admin-auth";

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "Name",
    "Attending",
    "Plus One",
    "Plus One Name",
    "Submitted At",
  ];

  const rows = (data ?? []).map((r) =>
    [
      r.name,
      r.attending ? "Yes" : "No",
      r.plus_one ? "Yes" : "No",
      r.plus_one_name ?? "",
      r.submitted_at,
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

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
