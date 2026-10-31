import { ArrowRight, BookOpen, Crosshair, Flag, X } from 'lucide-react';
import type { ReactNode } from 'react';

type Phase = 'reinforcement' | 'attack' | 'movement';

const steps: Array<{ icon: ReactNode; title: string; description: string }> = [
  {
    icon: <BookOpen size={20} />,
    title: 'Leia o mapa',
    description: 'Os marcadores táticos mostram quantas divisões guarnecem cada território. A cor da fronteira indica quem controla a região.',
  },
  {
    icon: <Flag size={20} />,
    title: 'Reforce suas linhas',
    description: 'Na fase de reforço, clique em um território sob seu comando e aloque suas divisões de reserva.',
  },
  {
    icon: <Crosshair size={20} />,
    title: 'Ataque com estratégia',
    description: 'Escolha um território com 2 ou mais tropas e ataque um vizinho. Cada troca elimina no máximo uma tropa; conquiste um território no turno para ganhar um caça de apoio.',
  },
];

interface OnboardingProps {
  phase: Phase;
  selectedNode: string | null;
  open: boolean;
  onOpen?: () => void;
  onClose: () => void;
  showCard?: boolean;
}

export function Onboarding({ phase, selectedNode, open, onOpen, onClose, showCard = false }: OnboardingProps) {
  const phaseIndex = phase === 'reinforcement' ? 1 : phase === 'attack' ? 2 : 3;
  const current = phase === 'reinforcement' ? steps[1] : steps[2];

  return (
    <>
      {showCard && (
        <section className="guide-card panel-card">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">PRIMEIROS PASSOS</span>
              <h2>Como jogar</h2>
            </div>
            <span className="guide-count">{phaseIndex}/3</span>
          </div>
          <div className="guide-progress" aria-label={`Etapa ${phaseIndex} de 3`}>
            {steps.map((step, index) => (
              <i key={step.title} className={index < phaseIndex ? 'is-done' : ''} />
            ))}
          </div>
          <div className="guide-current">
            <span className="guide-icon">{current.icon}</span>
            <div>
              <strong>{current.title}</strong>
              <p>
                {selectedNode
                  ? 'Você selecionou um território. Prossiga com a ação indicada pela fase atual.'
                  : current.description}
              </p>
            </div>
          </div>
          {onOpen && (
            <button className="guide-link" onClick={onOpen}>
              Abrir guia completo <ArrowRight size={15} />
            </button>
          )}
        </section>
      )}

      {open && (
        <div className="tutorial-backdrop" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
          <div className="tutorial-modal">
            <button className="tutorial-close" onClick={onClose} aria-label="Fechar guia">
              <X size={19} />
            </button>
            <span className="section-kicker">MANUAL DE OPERAÇÕES</span>
            <h2 id="tutorial-title">
              Comando Global<br />
              <em>Domine as fronteiras passo a passo.</em>
            </h2>
            <div className="tutorial-steps">
              {steps.map((step, index) => (
                <article
                  className={`tutorial-step ${index + 1 <= phaseIndex ? 'is-active' : ''}`}
                  key={step.title}
                >
                  <span>{index + 1}</span>
                  <div className="tutorial-step-icon">{step.icon}</div>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <button className="primary-action" onClick={onClose}>
              Entendi, retornar ao comando <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
