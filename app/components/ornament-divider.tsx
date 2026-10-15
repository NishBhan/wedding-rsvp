const INK = "#1B3A6B";
const GOLD = "#B08D4F";

// A gold sprig: a short stem with three pairs of leaves and a bud.
function Sprig({ x, flip }: { x: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 15) scale(${flip ? -1 : 1} 1)`} fill="none" stroke={GOLD} strokeWidth="1.1" strokeLinecap="round">
      <path d="M0 0 H46" />
      {[10, 22, 34].map((t) => (
        <path
          key={t}
          d={`M${t} 0 C${t + 3} -6 ${t + 9} -7 ${t + 11} -6 C${t + 8} -3 ${t + 4} -1 ${t} 0 Z M${t} 0 C${t + 3} 6 ${t + 9} 7 ${t + 11} 6 C${t + 8} 3 ${t + 4} 1 ${t} 0 Z`}
          fill={GOLD}
          fillOpacity=".25"
        />
      ))}
      <circle cx="49" cy="0" r="1.6" fill={GOLD} stroke="none" />
    </g>
  );
}

/* The divider from the save-the-date: gold sprigs either side of a small
   blue Delft flower. */
export default function OrnamentDivider({ hero = false }: { hero?: boolean }) {
  return (
    <div className={`ornament-divider${hero ? " hero-size" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 200 30" width={hero ? 170 : 190} height={hero ? 26 : 29}>
        <Sprig x={16} />
        <Sprig x={184} flip />
        <g transform="translate(100 15)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="3.2" ry="5.6" transform={`rotate(${a})`} fill={INK} fillOpacity=".85" />
          ))}
          <circle r="3.2" fill={GOLD} />
        </g>
      </svg>
    </div>
  );
}
