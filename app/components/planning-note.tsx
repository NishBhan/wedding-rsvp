import OrnamentDivider from "./ornament-divider";

/* "A little note for your planning", shared by the homepage and every
   invitation so the timings can only ever be stated once. The official
   celebrations are 14 and 15 November; the 16th is for travelling home. */
export default function PlanningNote() {
  return (
    <section className="planning-note">
      <div className="planning-note-inner">
        <OrnamentDivider />
        <h2>A little note for your planning</h2>
        <p>
          We&rsquo;re celebrating over two days and two nights. The celebrations begin on
          the evening of 14 November, and the last one runs late into the night of
          15 November.
        </p>
        <p>
          Please plan to arrive in Bengaluru by the afternoon of 14 November, and to
          travel home on 16 November, in the morning or early afternoon, whichever
          suits you.
        </p>
        <p>
          We&rsquo;re arranging where everyone stays on the nights of 14 and 15 November,
          so please don&rsquo;t book anything for those two nights.
        </p>
        <p className="planning-note-fine">
          The full agenda is on its way, along with details on getting around, what to
          wear, and ideas for a holiday in India if you&rsquo;d like to make a longer trip
          of it.
        </p>
      </div>
    </section>
  );
}
