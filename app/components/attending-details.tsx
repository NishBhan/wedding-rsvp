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
        <div className="details-panel-label">WE&rsquo;RE TAKING CARE OF YOUR STAY</div>
        <p>
          We&rsquo;re arranging where everyone stays on the nights of 14 and 15 November,
          so please don&rsquo;t book anything for those two nights. If you&rsquo;d like to
          make a longer holiday of your trip, we&rsquo;re happy to put you in touch with a
          travel desk.
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
        <p className="saved-note">Your calendar should open with 14 and 15 November 2027 ready to save.</p>
      )}
    </>
  );
}
