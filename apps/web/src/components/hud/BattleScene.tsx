import type { CSSProperties } from 'react';

interface BattleSceneProps {
  animationId: string;
  attacker: string;
  defender: string;
  attackerColor: string;
  defenderColor: string;
  attackerLosses: number;
  defenderLosses: number;
  winner: 'attacker' | 'defender';
  fighterSupport?: boolean;
}

function Soldier({ fallen = false }: { fallen?: boolean }) {
  return (
    <svg className={`battle-soldier ${fallen ? 'is-fallen' : ''}`} viewBox="0 0 96 128" aria-hidden="true">
      <ellipse className="soldier-shadow" cx="48" cy="119" rx="27" ry="5" />
      <path className="soldier-pack" d="M32 43 22 48 25 72 37 70Z" />
      <path className="soldier-leg" d="m39 77-8 27 7 3 13-23 6 23 8-1-2-30Z" />
      <path className="soldier-boot" d="m30 101-4 10 14 1 2-7m19-1 2 11 13-2-8-11" />
      <path className="soldier-vest" d="m35 42 24-2 12 31-10 12-27-2-8-13Z" />
      <path className="soldier-strap" d="m38 44 20 28m-17-29-6 25" />
      <path className="soldier-arm" d="m35 48-12 17 5 5 16-14m20-10 12 13-5 6-15-10" />
      <circle className="soldier-face" cx="49" cy="29" r="12" />
      <path className="soldier-neck" d="M43 38h12v8H43z" />
      <path className="soldier-helmet" d="M35 29a14 14 0 0 1 28 0v4H35Z" />
      <path className="soldier-visor" d="M34 32h30" />
      <path className="soldier-rifle" d="m48 55 27-15 3 5-27 16m19-14 7 1 7 5-3 4-8-4" />
      <path className="soldier-highlight" d="m42 47 6-2m-9 31 10 1" />
    </svg>
  );
}

function CasualtyGroup({ label, count, color }: { label: string; count: number; color: string }) {
  if (count <= 0) return null;
  const visibleFigures = Math.min(count, 3);

  return (
    <div className="battle-casualty-group" style={{ '--casualty-color': color } as CSSProperties}>
      <span className="battle-casualty-label">{label}</span>
      <div className="battle-casualty-figures" aria-hidden="true">
        {Array.from({ length: visibleFigures }, (_, index) => <Soldier key={index} fallen />)}
        {count > visibleFigures && <small>+{count - visibleFigures}</small>}
      </div>
      <strong>−{count} <span>BAIXAS</span></strong>
    </div>
  );
}

export function BattleScene({
  animationId,
  attacker,
  defender,
  attackerColor,
  defenderColor,
  attackerLosses,
  defenderLosses,
  winner,
  fighterSupport = false,
}: BattleSceneProps) {
  return (
    <div
      key={animationId}
      className={`battle-scene is-${winner}-win`}
      role="img"
      aria-label={`Soldados de ${attacker} e ${defender} se enfrentam. Baixas: ${attacker} ${attackerLosses}, ${defender} ${defenderLosses}.`}
    >
      <div className="battle-scene-scanlines" />
      <div className="battle-scene-grid" />
      <div className="battle-scene-ground" />
      {fighterSupport && <div className="battle-aircraft" aria-label="Apoio de caça" role="img"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="M3 21 26 17 36 3l6 1-3 13 16-2 6 4-23 7-9 11-5-1 4-10-19 1Z" /></svg><span>APOIO AÉREO</span></div>}
      <div className="battle-scene-flash" />
      <div className="battle-impact-mark" aria-hidden="true">✦</div>
      <div className="battle-fighter battle-fighter--attacker" style={{ '--fighter-color': attackerColor } as CSSProperties}>
        <Soldier />
      </div>
      <div className="battle-fighter battle-fighter--defender" style={{ '--fighter-color': defenderColor } as CSSProperties}>
        <Soldier />
      </div>
      <div className="battle-scene-name battle-scene-name--attacker">{attacker}</div>
      <div className="battle-scene-name battle-scene-name--defender">{defender}</div>
      <div className="battle-casualties">
        <CasualtyGroup label="ATACANTE" count={attackerLosses} color={attackerColor} />
        <CasualtyGroup label="DEFENSOR" count={defenderLosses} color={defenderColor} />
      </div>
    </div>
  );
}
