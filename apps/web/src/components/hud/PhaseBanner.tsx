import { Shield, Swords, Truck } from 'lucide-react';
import './PhaseBanner.css';

interface PhaseBannerProps {
  phase: 'reinforcement' | 'attack' | 'movement';
  isMyTurn: boolean;
  secondsRemaining: number | null;
  roundNumber: number;
}

const phaseInfo = {
  reinforcement: {
    icon: Shield,
    code: 'FASE 1 DE 3 · REFORÇO',
    title: 'Prepare suas defesas',
    description: 'Escolha um território seu e envie reforços.',
    typeClass: 'is-reinforcement',
  },
  attack: {
    icon: Swords,
    code: 'FASE 2 DE 3 · ATAQUE',
    title: 'Expanda seu domínio',
    description: 'Escolha seu território e depois uma fronteira inimiga.',
    typeClass: 'is-attack',
  },
  movement: {
    icon: Truck,
    code: 'FASE 3 DE 3 · MANOBRA',
    title: 'Reposicione suas tropas',
    description: 'Escolha dois territórios seus que sejam vizinhos.',
    typeClass: 'is-movement',
  },

} as const;

export function PhaseBanner({ phase, isMyTurn, secondsRemaining, roundNumber }: PhaseBannerProps) {
  const current = phaseInfo[phase] ?? phaseInfo.reinforcement;
  const Icon = current.icon;

  return (
    <div className="phase-banner-container" aria-live="polite">
      <div className={`phase-banner-card ${current.typeClass}`}>
        <div className="phase-banner-eyebrow">
          <Icon size={12} />
          <span>{current.code}</span>
          {!isMyTurn && <span>· AGUARDE SUA VEZ</span>}
          {secondsRemaining !== null && <span className={`phase-countdown ${secondsRemaining <= 10 ? 'is-urgent' : ''}`} role="timer" aria-live="off" aria-label={`Tempo restante: ${secondsRemaining} segundos`}>{String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:{String(secondsRemaining % 60).padStart(2, '0')}</span>}
        </div>
        <div className="phase-banner-title">
          {phase === 'attack' && roundNumber === 1 ? 'Trégua da rodada inicial' : current.title}
        </div>
        <div className="phase-banner-description">
          {phase === 'attack' && roundNumber === 1
            ? 'Trégua inicial: ataques liberados a partir da rodada 2.'
            : isMyTurn ? current.description : 'Acompanhe o turno do outro comandante.'}
        </div>
      </div>
    </div>
  );
}
