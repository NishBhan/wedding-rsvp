"use client";

import { useState } from "react";
import CalendarCheckIcon from "./calendar-check-icon";
import { GOOGLE_WEDDING_CALENDAR_URL } from "@/lib/calendar";

// Shown on every "yes" confirmation: what happens next, plus the wedding
// itself for any calendar (Apple and Outlook via .ics, or Google).
export default function AttendingDetails() {
  const [opened, setOpened] = useState(false);
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
        <a href="/calendar/wedding.ics" onClick={() => setOpened(true)} className="calendar-link">
          Add the wedding to my calendar
          <CalendarCheckIcon />
        </a>
      </div>
      <p className="calendar-alt">
        Using Google Calendar?{" "}
        <a href={GOOGLE_WEDDING_CALENDAR_URL} target="_blank" rel="noopener" className="calendar-link">
          Add it there instead
        </a>
      </p>
      {opened && (
        <p className="saved-note">Your calendar should open with 14 to 16 November 2027 ready to save.</p>
      )}
    </>
  );
}
