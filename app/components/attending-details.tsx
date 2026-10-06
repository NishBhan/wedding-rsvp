"use client";

import { useState } from "react";
import CalendarCheckIcon from "./calendar-check-icon";
import { downloadWeddingIcs } from "@/lib/calendar";

// Shown on every "yes" confirmation: what happens next, plus a one-tap
// calendar download for the wedding itself.
export default function AttendingDetails() {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <div className="details-panel">
        <div className="details-panel-label">YOU DON&rsquo;T NEED TO FIGURE OUT THE REST JUST YET</div>
        <p>
          The full agenda, along with accommodation, transport and dress guidance, is
          coming soon, so there&rsquo;s no need to book your travel just yet. If
          you&rsquo;re thinking of extending your trip into a longer holiday, we&rsquo;re
          happy to connect you with a travel desk to help plan it.
        </p>
      </div>
      <div className="calendar-link-row">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            downloadWeddingIcs();
            setSaved(true);
          }}
          className="calendar-link"
        >
          Add the wedding to my calendar
          <CalendarCheckIcon />
        </a>
      </div>
      {saved && <p className="saved-note">Saved — 14 to 16 November 2027 are held in your calendar.</p>}
    </>
  );
}
