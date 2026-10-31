import type { CSSProperties } from 'react';

interface BattleAnimationProps {
  source: [number, number];
  target: [number, number];
  color: string;
  troopCount: number;
  animationId: string;
}

export function BattleAnimation({ source, target, color, troopCount, animationId }: BattleAnimationProps) {
  const [sourceX, sourceY] = source;
  const [targetX, targetY] = target;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.hypot(dx, dy) || 1;
  const offsetX = (-dy / distance) * 5;
  const offsetY = (dx / distance) * 5;
  const controlX = (sourceX + targetX) / 2 - (dy / distance) * Math.min(42, distance * 0.12);
  const controlY = (sourceY + targetY) / 2 + (dx / distance) * Math.min(42, distance * 0.12);
  const route = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
  const units = Math.max(2, Math.min(5, Math.ceil(troopCount / 2)));

  return (
    <g className="battle-animation-layer" pointerEvents="none" aria-hidden="true">
      <path className="battle-route-glow" d={route} />
      <path className="battle-route-dash" d={route} />
      <circle className="battle-origin-pulse" cx={sourceX} cy={sourceY} r="16" />
      <circle className="battle-impact-ring" cx={targetX} cy={targetY} r="8" />
      <g className="battle-explosion" transform={`translate(${targetX} ${targetY})`}>
        <circle className="explosion-shockwave" r="8" />
        <path className="explosion-burst" d="M0-25 5-13 13-20 12-8 25-9 16 0 25 8 12 9 16 21 5 14 0 27-5 14-15 21-12 9-25 8-16 0-25-9-12-8-15-20-5-13Z" />
        <circle className="explosion-core" r="9" />
        <path className="explosion-rays" d="M0-34 2-19M24-24 14-13M34 0 19 2M24 24 13 14M0 35-2 19M-24 24-14 13M-35 0-19-2M-24-24-13-14" />
        <circle className="explosion-smoke smoke-a" cx="-12" cy="-5" r="8" />
        <circle className="explosion-smoke smoke-b" cx="9" cy="-10" r="7" />
        <circle className="explosion-smoke smoke-c" cx="8" cy="8" r="8" />
        <path className="explosion-sparks" d="M-21-19l-5-7m40 9 6-7m4 31 8 3m-44 2-7 6" />
      </g>
      <g className="battle-impact" transform={`translate(${targetX} ${targetY})`}>
        <circle className="battle-impact-core" r="7" />
        <path d="M-16 0h32M0-16v32M-11-11l22 22M11-11-11 11" className="battle-impact-rays" />
        <circle className="battle-smoke smoke-one" cx="-8" cy="-3" r="5" />
        <circle className="battle-smoke smoke-two" cx="6" cy="-8" r="4" />
        <circle className="battle-smoke smoke-three" cx="3" cy="6" r="5" />
      </g>
      {Array.from({ length: units }, (_, index) => {
        const lane = index - (units - 1) / 2;
        const start = `${sourceX + offsetX * lane} ${sourceY + offsetY * lane}`;
        const path = `M ${start} Q ${controlX + offsetX * lane} ${controlY + offsetY * lane} ${targetX + offsetX * lane * 0.55} ${targetY + offsetY * lane * 0.55}`;
        return (
          <g className="battle-unit-flight" key={`${animationId}-${index}`}>
            <animateMotion path={path} begin={`${index * 0.11}s`} dur="1.35s" fill="freeze" rotate="auto" />
            <g className="battle-unit" style={{ '--unit-color': color } as CSSProperties}>
              <ellipse className="battle-unit-shadow" cx="0" cy="8" rx="6.5" ry="2.5" />
              <path className="battle-unit-pack" d="M-5-4h3v8h-3z" />
              <path className="battle-unit-body" d="M-3-4 2-4l2 7H-4z" />
              <path className="battle-unit-limb" d="m-2 2-3 5m6-5 3 5m-6-10-4 3m8-3 5-3" />
              <circle className="battle-unit-head" cx="0" cy="-7" r="2.5" />
              <path className="battle-unit-helmet" d="M-3-7a3 3 0 0 1 6 0z" />
              <path className="battle-unit-rifle" d="m3-3 8-4m-1 1 2 1" />
              <path className="battle-unit-highlight" d="M-1-3 1-3" />
            </g>
          </g>
        );
      })}
    </g>
  );
}
