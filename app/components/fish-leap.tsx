/* Shown above a "yes" confirmation: the site's own fish (the one in the
   landscape) leaping out of the water, once, as on the save-the-date and
   in fishfoundherwater. Pure SVG and CSS; on devices that ask for reduced
   motion it simply appears mid-leap. */
export default function FishLeap() {
  return (
    <svg className="fish-leap" viewBox="0 0 180 96" width="132" aria-hidden="true">
      <g fill="none" stroke="#1B3A6B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 80 H70 M110 80 H162 M40 90 H140" strokeOpacity=".35" />
        <path className="fish-leap-trail" d="M66 78 C74 52 92 36 112 32" stroke="#B08D4F" strokeDasharray="2 5" />
        <g className="fish-leap-splash" fill="#1B3A6B" stroke="none">
          <circle cx="76" cy="70" r="1.6" opacity=".45" />
          <circle cx="86" cy="74" r="1.2" opacity=".35" />
          <circle cx="66" cy="72" r="1" opacity=".3" />
        </g>
        <g className="fish-leap-fish">
          <g transform="translate(162 16) rotate(-28) scale(-0.72 0.72)">
            <path d="M0 16 C12 4 34 0 50 8 C58 12 62 18 64 22 C58 30 44 36 30 36 C16 36 4 26 0 16 Z" fill="#1B3A6B" fillOpacity=".1" />
            <path d="M64 22 C70 16 76 12 82 10 C80 18 80 26 82 32 C76 30 69 27 64 22 Z" />
            <path d="M24 10 C28 16 28 26 24 34" />
            <circle cx="12" cy="16" r="1.4" fill="#1B3A6B" stroke="none" />
          </g>
        </g>
      </g>
    </svg>
  );
}
