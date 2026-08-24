import Link from "next/link";

export default function SiteShell({
  children,
  showArch = true,
}: {
  children: React.ReactNode;
  showArch?: boolean;
}) {
  return (
    <div className="rsvp-page-bg">
      <svg
        className="rsvp-pattern"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="nwGround"
            width="190"
            height="190"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(8)"
          >
            <g
              fill="none"
              stroke="#1B3A6B"
              strokeOpacity=".14"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M44 74 V50" />
              <path d="M36 50 C35 40 39 33 44 29 C49 33 53 40 52 50 C49 54 39 54 36 50 Z" />
              <path d="M44 30 V51M37 47 C33 40 35 35 38 32M51 47 C55 40 53 35 50 32" />
              <path d="M44 66 C37 65 32 60 30 55M44 70 C51 69 56 64 58 59" />
              <path d="M140 150 C136 140 137 130 140 124 C143 130 144 140 140 150 Z" />
              <path d="M140 150 C131 145 127 137 126 130 C133 133 138 141 140 150 Z" />
              <path d="M140 150 C149 145 153 137 154 130 C147 133 142 141 140 150 Z" />
              <path d="M122 154 C129 150 151 150 158 154" />
              <path d="M96 20 C110 20 116 6 130 6M150 96 C150 110 164 116 164 130" />
              <circle cx="18" cy="130" r="1.4" strokeOpacity=".2" />
              <circle cx="168" cy="42" r="1.4" strokeOpacity=".2" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nwGround)" />
      </svg>

      <div className="rsvp-vine">
        <svg width="100%" height="46" viewBox="0 0 1200 46" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="nwvineA" width="150" height="46" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#1B3A6B" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M0 38 C18 38 24 30 37 30 C50 30 56 38 75 38 C94 38 100 30 113 30 C126 30 132 38 150 38" />
                <path d="M37 30 V16" />
                <path d="M31 16 C30 9 33 4 37 2 C41 4 44 9 43 16 C41 19 33 19 31 16 Z" fill="#1B3A6B" fillOpacity=".16" />
                <path d="M37 3 V17M31.5 15 C29 10 30 6 32 4M42.5 15 C45 10 44 6 42 4" />
                <path d="M37 27 C31 26 27 22 26 18M37 27 C43 26 47 22 48 18" />
                <path d="M113 30 C110 26 108 23 108 20M113 30 C116 26 118 23 118 20" />
                <path d="M113 29 C110 22 111 16 113 12 C115 16 116 22 113 29 Z" fill="#1B3A6B" fillOpacity=".16" />
                <path d="M113 29 C106 25 103 20 102 15 C107 17 111 22 113 29 Z" fill="#1B3A6B" fillOpacity=".1" />
                <path d="M113 29 C120 25 123 20 124 15 C119 17 115 22 113 29 Z" fill="#1B3A6B" fillOpacity=".1" />
                <path d="M113 29 C104 27 99 24 96 21M113 29 C122 27 127 24 130 21" />
                <circle cx="75" cy="30" r="2.2" fill="#B08D4F" stroke="none" />
                <path d="M69 33 C71 31 73 30 75 30M81 33 C79 31 77 30 75 30" />
                <circle cx="55" cy="20" r="1.3" fill="#1B3A6B" stroke="none" />
                <circle cx="95" cy="20" r="1.3" fill="#1B3A6B" stroke="none" />
              </g>
            </pattern>
          </defs>
          <rect width="1200" height="46" fill="url(#nwvineA)" />
        </svg>
      </div>

      <header className="rsvp-header">
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <img src="/monogram.png" alt="Nishtha & Wouter" className="rsvp-header-logo" />
        </Link>
      </header>

      <main className="rsvp-main">
        {showArch && (
          <div className="rsvp-arch" aria-hidden="true">
            <svg viewBox="0 0 400 900" preserveAspectRatio="xMidYMin meet">
              <g fill="none" stroke="#1B3A6B" strokeOpacity=".15" strokeWidth="1.6" strokeLinecap="round">
                <path d="M34 900 V132 C34 92 92 84 116 48 C138 88 172 96 200 56 C228 96 262 88 284 48 C308 84 366 92 366 132 V900" />
                <path d="M48 900 V138 C48 104 100 96 124 66 C144 100 176 108 200 74 C224 108 256 100 276 66 C300 96 352 104 352 138 V900" />
              </g>
            </svg>
          </div>
        )}

        <div className="rsvp-shell">{children}</div>
      </main>
    </div>
  );
}
