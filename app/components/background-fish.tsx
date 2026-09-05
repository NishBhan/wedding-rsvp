"use client";

import { useEffect, useState, type CSSProperties } from "react";

type FishStyle = CSSProperties & Record<`--${string}`, string>;

/* Three faint fish drifting behind every screen. Paths are randomised once
   per page load, then run as pure CSS so they cost nothing to animate.
   Generated client-side only (after mount) so server and client markup
   match — the randomised inline styles would otherwise mismatch on hydration. */
function makeDriftingFish(count: number): FishStyle[] {
  const R = (a: number, b: number) => a + Math.random() * (b - a);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return Array.from({ length: count }, (_, i) => {
    const sx = R(6, 76);
    const sy = R(10, 78);
    const dur = R(160, 250);
    const style: FishStyle = {
      position: "absolute",
      left: sx.toFixed(2) + "vw",
      top: sy.toFixed(2) + "vh",
      width: R(30, 48).toFixed(1) + "px",
      opacity: 0.11,
      animation:
        "nwDrift " + dur.toFixed(0) + "s ease-in-out " + (-R(0, dur)).toFixed(0) + "s infinite both",
      "--fx": i % 2 ? "-1" : "1",
    };
    let px = sx;
    let py = sy;
    for (let k = 1; k <= 4; k++) {
      px = clamp(px + R(-22, 22), 3, 84);
      py = clamp(py + R(-16, 16), 5, 84);
      style[`--dx${k}`] = (px - sx).toFixed(2) + "vw";
      style[`--dy${k}`] = (py - sy).toFixed(2) + "vh";
      style[`--r${k}`] = R(-7, 7).toFixed(1) + "deg";
    }
    return style;
  });
}

export default function BackgroundFish() {
  const [fish, setFish] = useState<FishStyle[]>([]);

  useEffect(() => {
    setFish(makeDriftingFish(3));
  }, []);

  if (fish.length === 0) return null;

  return (
    <div aria-hidden="true" className="bg-fish-layer">
      {fish.map((style, i) => (
        <div key={i} style={style}>
          <svg viewBox="608 214 92 48" width="100%" style={{ display: "block" }}>
            <g fill="none" stroke="#1B3A6B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M612 236 C624 224 646 220 662 228 C670 232 674 238 676 242 C670 250 656 256 642 256 C628 256 616 246 612 236 Z" />
              <path d="M676 242 C682 236 688 232 694 230 C692 238 692 246 694 252 C688 250 681 247 676 242 Z" />
              <path d="M636 230 C640 236 640 246 636 254" />
              <circle cx="624" cy="236" r="1.2" fill="#1B3A6B" stroke="none" />
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}
