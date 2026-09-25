import { Shield, Swords, Truck } from 'lucide-react';
import './PhaseBanner.css';

interface PhaseBannerProps {
  phase: 'reinforcement' | 'attack' | 'movement';
  isMyTurn: boolean;
}

const phaseInfo = {
  reinforcement: {
    icon: Shield,
    code: 'PROTOCOLO // 01 · REFORÇO',
    title: 'Fortifique seus territórios',
    description: 'Distribua seus reforços disponíveis nos territórios sob seu controle.',
    typeClass: 'is-reinforcement',
  },
  attack: {
    icon: Swords,
    code: 'PROTOCOLO // 02 · ATAQUE',
    title: 'Expanda seu domínio',
    description: 'Selecione uma base aliada e mire uma fronteira inimiga adjacente.',
    typeClass: 'is-attack',
  },
  movement: {
    icon: Truck,
    code: 'PROTOCOLO // 03 · MANOBRA',
    title: 'Reposicione suas tropas',
    description: 'Transfira tropas entre territórios aliados conectados para consolidar suas linhas.',
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
          {!isMyTurn && <span>· MODO OBSERVAÇÃO</span>}
        </div>
        <div className="phase-banner-title">{current.title}</div>
        <div className="phase-banner-description">
          {isMyTurn ? current.description : 'Aguarde as ações da facção ativa neste turno.'}
        </div>
      </div>
    </div>
  );
}
