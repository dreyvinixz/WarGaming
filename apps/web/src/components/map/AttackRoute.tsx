interface AttackRouteProps {
  sourcePos: [number, number];
  targetPos: [number, number];
  type: 'attack' | 'movement';
  isEngaged?: boolean;
}

export function AttackRoute({ sourcePos, targetPos, type, isEngaged }: AttackRouteProps) {
  const [x1, y1] = sourcePos;
  const [x2, y2] = targetPos;

  // Calculate shortened vector to prevent arrow from drawing beneath troop badges
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return null;

  // Offset by ~20px so arrow head stops just outside the target badge
  const offset = 22;
  const targetX = x2 - (dx / distance) * offset;
  const targetY = y2 - (dy / distance) * offset;

  const strokeColor = type === 'attack' ? '#ffd600' : '#00d9f5';
  const markerUrl = type === 'attack' ? 'url(#attackArrowMarker)' : 'url(#moveArrowMarker)';

  return (
    <g className="tactical-vector-route" pointerEvents="none">
      <line
        x1={x1}
        y1={y1}
        x2={targetX}
        y2={targetY}
        stroke={strokeColor}
        strokeWidth={isEngaged ? '2.5' : '1.8'}
        strokeDasharray="6 4"
        markerEnd={markerUrl}
        className={`tactical-vector-line is-${type} ${isEngaged ? 'is-engaged' : ''}`}
      />
    </g>
  );
}
