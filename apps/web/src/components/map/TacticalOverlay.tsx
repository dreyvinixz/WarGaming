export function TacticalOverlay() {
  return (
    <g className="tactical-atmosphere-layer" pointerEvents="none" aria-hidden="true">
      {/* Background Radar Rings */}
      <g className="tactical-radar-rings" opacity="0.08">
        <circle cx="505" cy="333" r="120" fill="none" stroke="#00d9f5" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="505" cy="333" r="240" fill="none" stroke="#00d9f5" strokeWidth="1" />
        <circle cx="505" cy="333" r="360" fill="none" stroke="#00d9f5" strokeWidth="1" strokeDasharray="3 6" />
        <circle cx="505" cy="333" r="480" fill="none" stroke="#00d9f5" strokeWidth="1" />
      </g>

      {/* Grid Coordinates Lines */}
      <g className="tactical-grid-lines" opacity="0.12" stroke="#2a4b70" strokeWidth="0.8">
        {/* Equator & Parallels */}
        <line x1="0" y1="170" x2="1010" y2="170" strokeDasharray="3 5" />
        <line x1="0" y1="270" x2="1010" y2="270" strokeDasharray="2 4" />
        <line x1="0" y1="370" x2="1010" y2="370" strokeDasharray="6 6" strokeWidth="1" />
        <line x1="0" y1="470" x2="1010" y2="470" strokeDasharray="2 4" />
        <line x1="0" y1="570" x2="1010" y2="570" strokeDasharray="3 5" />

        {/* Meridians */}
        <line x1="250" y1="0" x2="250" y2="666" strokeDasharray="2 5" />
        <line x1="505" y1="0" x2="505" y2="666" strokeDasharray="4 6" strokeWidth="1" />
        <line x1="760" y1="0" x2="760" y2="666" strokeDasharray="2 5" />
      </g>

      {/* Coordinate Labels */}
      <g className="tactical-coord-labels" fill="#c7b889" fontSize="8" fontFamily="'Barlow Condensed', sans-serif" opacity="0.6">
        <text x="12" y="174">N 60°</text>
        <text x="12" y="274">N 30°</text>
        <text x="12" y="374">EQ 00°</text>
        <text x="12" y="474">S 30°</text>
        <text x="12" y="574">S 60°</text>

        <text x="254" y="650">W 90°</text>
        <text x="509" y="650">MERIDIAN 0°</text>
        <text x="764" y="650">E 90°</text>
      </g>

      {/* Corner Tactical Reticles */}
      <g className="tactical-corner-reticles" stroke="#00d9f5" strokeWidth="1.2" opacity="0.25">
        <path d="M 20 30 L 20 20 L 30 20" fill="none" />
        <path d="M 990 30 L 990 20 L 980 20" fill="none" />
        <path d="M 20 636 L 20 646 L 30 646" fill="none" />
        <path d="M 990 636 L 990 646 L 980 646" fill="none" />
      </g>
    </g>
  );
}
