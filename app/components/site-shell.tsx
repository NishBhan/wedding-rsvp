import Link from "next/link";
import BackgroundFish from "./background-fish";

function FrameCorner({ position }: { position: "tr" | "bl" }) {
  return (
    <svg
      width="116"
      height="116"
      viewBox="0 0 120 120"
      className={`frame-corner frame-corner-${position}`}
      aria-hidden="true"
    >
      <g fill="none" stroke="#1B3A6B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6 C34 18 58 40 78 70 C88 85 94 98 98 112" />
        <path d="M30 14 C40 20 46 28 48 38" />
        <path d="M14 30 C20 40 28 46 38 48" />
        <path
          d="M52 40 C48 32 50 25 55 21 C61 25 64 32 60 41 C57 44 55 44 52 40 Z"
          fill="#1B3A6B"
          fillOpacity=".1"
        />
        <path
          d="M84 78 C79 71 80 63 85 59 C91 63 94 71 89 79 C87 82 86 82 84 78 Z"
          fill="#1B3A6B"
          fillOpacity=".08"
        />
      </g>
      <g fill="#B08D4F" stroke="none">
        <circle cx="57" cy="20" r="1.6" />
        <circle cx="87" cy="58" r="1.6" />
        <circle cx="24" cy="24" r="1.1" />
      </g>
    </svg>
  );
}

export default function SiteShell({
  children,
  showArch = true,
}: {
  children: React.ReactNode;
  showArch?: boolean;
}) {
  return (
    <div className="rsvp-page-bg">
      {/* Almost-imperceptible paper texture, tying the page to the stationery
          without reading as distressed or aged. */}
      <svg className="paper-texture" aria-hidden="true">
        <defs>
          <filter id="nwPaper" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#nwPaper)" />
      </svg>

      <BackgroundFish />

      <div className="stationery-frame" aria-hidden="true">
        <FrameCorner position="tr" />
        <FrameCorner position="bl" />
      </div>

      <header className="rsvp-header">
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <img src="/assets/monogram-mark.png" alt="Nishtha & Wouter" className="rsvp-header-logo" />
        </Link>
      </header>

      <main className="rsvp-main">
        {showArch && (
          <div className="rsvp-arch" aria-hidden="true">
            <svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMin meet" style={{ display: "block" }}>
              <defs>
                <linearGradient id="nwArchFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="1" />
                  <stop offset=".55" stopColor="#fff" stopOpacity="1" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <mask id="nwArchMask">
                  <rect width="400" height="190" fill="url(#nwArchFade)" />
                </mask>
              </defs>
              <g
                fill="none"
                stroke="#1B3A6B"
                strokeOpacity=".15"
                strokeWidth="1.6"
                strokeLinecap="round"
                mask="url(#nwArchMask)"
              >
                <path d="M34 190 V132 C34 92 92 84 116 48 C138 88 172 96 200 56 C228 96 262 88 284 48 C308 84 366 92 366 132 V190" />
                <path d="M48 190 V138 C48 104 100 96 124 66 C144 100 176 108 200 74 C224 108 256 100 276 66 C300 96 352 104 352 138 V190" />
              </g>
            </svg>
          </div>
        )}

        <div className="rsvp-shell">{children}</div>
      </main>
    </div>
  );
}
