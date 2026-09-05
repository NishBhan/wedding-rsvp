/* The hero monogram: a fixed base layer plus a fish cut into its own
   transparent layer so it can drift and tilt slightly without redrawing
   anything else in the mark. Reads as the fish breathing in water, not
   as an animation. */
export default function AnimatedMonogram() {
  return (
    <div className="monogram-stack">
      <img src="/assets/monogram-base.png" alt="Nishtha & Wouter monogram" />
      <img src="/assets/monogram-fish.png" alt="" aria-hidden="true" className="monogram-fish" />
    </div>
  );
}
