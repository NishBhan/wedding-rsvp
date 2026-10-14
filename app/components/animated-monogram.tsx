import MonogramImg from "./monogram-img";

/* The hero monogram: a fixed base layer plus a fish cut into its own
   transparent layer so it can drift and tilt slightly without redrawing
   anything else in the mark. Reads as the fish breathing in water, not
   as an animation. */
export default function AnimatedMonogram() {
  return (
    <div className="monogram-stack">
      <MonogramImg name="monogram-base" alt="Nishtha & Wouter monogram" />
      <MonogramImg name="monogram-fish" alt="" ariaHidden className="monogram-fish" />
    </div>
  );
}
