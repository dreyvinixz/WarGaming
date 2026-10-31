import { Shield, Swords, Truck } from 'lucide-react';
import './PhaseBanner.css';

interface PhaseBannerProps {
  phase: 'reinforcement' | 'attack' | 'movement';
  isMyTurn: boolean;
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

export function PhaseBanner({ phase, isMyTurn }: PhaseBannerProps) {
  const current = phaseInfo[phase] ?? phaseInfo.reinforcement;
  const Icon = current.icon;

  return (
    <div className="phase-banner-container" aria-live="polite">
      <div className={`phase-banner-card ${current.typeClass}`}>
        <div className="phase-banner-eyebrow">
          <Icon size={12} />
          <span>{current.code}</span>
          {!isMyTurn && <span>· AGUARDE SUA VEZ</span>}
        </div>
        <div className="phase-banner-title">{current.title}</div>
        <div className="phase-banner-description">
          {isMyTurn ? current.description : 'Acompanhe o turno do outro comandante.'}
        </div>
      </div>
    </div>
  );
}
