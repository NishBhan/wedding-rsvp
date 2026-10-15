"use client";

import MonogramImg from "./components/monogram-img";
/* Shown instead of Next's bare "Application error" if a page crashes in
   the browser (a dropped connection mid-send, a browser extension
   rewriting the page). Reassures the guest and gives them a way back. */
export default function Error() {
  return (
    <div className="rsvp-page-bg">
      <main className="rsvp-main">
        <div className="rsvp-shell">
          <div className="rsvp-section confirmation">
            <MonogramImg name="monogram-mark" alt="" className="monogram" />
            <h1>Something went wrong on this page.</h1>
            <p>
              If you were sending your reply, it may still have reached us. Please
              reopen the link you were sent to check your reply, or try again.
            </p>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Reload the page
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
