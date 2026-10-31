import { useEffect, useState } from 'react';

interface BattleDieProps {
  value: number;
  side: 'attack' | 'defense';
  animationId: string;
}

function seedFor(value: string) {
  let seed = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    seed = Math.imul(seed ^ value.charCodeAt(index), 16777619);
  }
  return seed >>> 0;
}

export function BattleDie({ value, side, animationId }: BattleDieProps) {
  const [face, setFace] = useState(1);
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    let seed = seedFor(`${animationId}:${side}`) || 1;
    let elapsed = 0;
    setFace(1);
    setRolling(true);

    const timer = window.setInterval(() => {
      elapsed += 90;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      if (elapsed < 1170) {
        setFace((seed % 6) + 1);
      } else {
        setFace(value);
        setRolling(false);
        window.clearInterval(timer);
      }
    }, 90);

    return () => window.clearInterval(timer);
  }, [animationId, side, value]);

  return (
    <div
      className={`battle-die ${side === 'defense' ? 'defense' : ''} ${rolling ? 'is-rolling' : 'has-landed'}`}
      role="img"
      aria-label={`${side === 'attack' ? 'Dado do atacante' : 'Dado do defensor'}: ${rolling ? 'rolando' : value}`}
      aria-live="off"
    >
      <span>{face}</span>
      {rolling && <small className="battle-die-status">ROLANDO</small>}
    </div>
  );
}
