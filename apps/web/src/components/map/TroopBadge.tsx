import { useState, useEffect } from 'react';

interface TroopBadgeProps {
  nodeId: string;
  troops: number;
  color: string;
  isSelected: boolean;
  isTarget: boolean;
  isSelectable: boolean;
  x: number;
  y: number;
  onClick: (nodeId: string) => void;
  name: string;
}

export function TroopBadge({
  nodeId,
  troops,
  color,
  isSelected,
  isTarget,
  isSelectable,
  x,
  y,
  onClick,
  name,
}: TroopBadgeProps) {
  const [prevTroops, setPrevTroops] = useState(troops);
  const [floatingBonus, setFloatingBonus] = useState<number | null>(null);

  if (troops > prevTroops) {
    setPrevTroops(troops);
    setFloatingBonus(troops - prevTroops);
  } else if (troops !== prevTroops) {
    setPrevTroops(troops);
  }

  useEffect(() => {
    if (floatingBonus !== null) {
      const timer = setTimeout(() => {
        setFloatingBonus(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [floatingBonus]);


  // Scaled dimensions based on troop count
  const isLarge = troops >= 10;
  const width = isLarge ? 38 : 32;
  const height = 22;
  const rx = 5;

  return (
    <g
      data-node-id={nodeId}
      className={`atlas-troop-marker tactical-troop-marker ${isSelected ? 'is-selected' : ''} ${isTarget ? 'is-target' : ''} ${isSelectable ? 'is-selectable' : ''}`}
      transform={`translate(${x} ${y})`}
      onClick={() => onClick(nodeId)}
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${troops} divisões`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(nodeId);
        }
      }}
    >
      {/* Outer Pulse Ring when Selected or Target */}
      {(isSelected || isTarget) && (
        <rect
          x={-(width / 2) - 4}
          y={-(height / 2) - 4}
          width={width + 8}
          height={height + 8}
          rx={rx + 2}
          fill="none"
          stroke={isTarget ? '#ff475d' : '#00d9f5'}
          strokeWidth="1.5"
          className="tactical-marker-pulse"
        />
      )}

      {/* Main Badge Base */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={rx}
        fill="#050b14"
        stroke={color}
        strokeWidth={isSelected ? '2.5' : '1.8'}
        filter={isSelected ? 'url(#tacticalGlow)' : undefined}
        className="tactical-marker-base"
      />

      {/* Military Chevron / Glyph */}
      <text
        x={-width / 2 + 7}
        y="3"
        fill={color}
        fontSize="8"
        fontFamily="'Chakra Petch', sans-serif"
        textAnchor="middle"
        pointerEvents="none"
      >
        ◈
      </text>

      {/* Troops Number */}
      <text
        x={isLarge ? 4 : 3}
        y="4"
        fill="#edf8ff"
        fontSize="11"
        fontWeight="700"
        fontFamily="'Rajdhani', 'Chakra Petch', sans-serif"
        textAnchor="middle"
        pointerEvents="none"
      >
        {String(troops).padStart(2, '0')}
      </text>

      {/* Floating +N Number upon Reinforcement */}
      {floatingBonus !== null && (
        <g className="floating-reinforce-tag" transform="translate(0, -18)">
          <rect x="-14" y="-12" width="28" height="15" rx="3" fill="#00d9f5" />
          <text
            x="0"
            y="-1"
            fill="#040810"
            fontSize="10"
            fontWeight="800"
            fontFamily="'Rajdhani', sans-serif"
            textAnchor="middle"
          >
            +{floatingBonus}
          </text>
        </g>
      )}

      <title>{`${name} — ${troops} tropas`}</title>
    </g>
  );
}
