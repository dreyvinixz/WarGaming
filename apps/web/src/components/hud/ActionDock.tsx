import { ArrowRight, ChevronRight, Eye, Shield, Swords, Truck } from 'lucide-react';
import './ActionDock.css';

interface ActionDockProps {
  phase: 'reinforcement' | 'attack' | 'movement';
  isMyTurn: boolean;
  onAdvancePhase: () => void;
  onEndTurn: () => void;
  onToggleObjective: () => void;
}

export function ActionDock({
  phase,
  isMyTurn,
  onAdvancePhase,
  onEndTurn,
  onToggleObjective,
}: ActionDockProps) {
  return (
    <div className="action-dock-container" role="toolbar" aria-label="Ações da Partida">
      <div className="action-dock">
        <div className={`dock-slot ${phase === 'reinforcement' ? 'is-active phase-reinforce' : ''}`}>
          <span className="dock-icon"><Shield size={16} /></span>
          <span>REFORÇO</span>
        </div>

        <div className={`dock-slot ${phase === 'attack' ? 'is-active phase-attack' : ''}`}>
          <span className="dock-icon"><Swords size={16} /></span>
          <span>ATAQUE</span>
        </div>

        <div className={`dock-slot ${phase === 'movement' ? 'is-active phase-movement' : ''}`}>
          <span className="dock-icon"><Truck size={16} /></span>
          <span>MANOBRA</span>
        </div>

        <button className="dock-slot" onClick={onToggleObjective} title="Ver objetivo e inteligência">
          <span className="dock-icon"><Eye size={16} /></span>
          <span>INTEL</span>
        </button>
      </div>

      {isMyTurn && (
        <div className="dock-actions-group">
          {phase !== 'movement' ? (
            <button className="dock-btn dock-btn-advance" onClick={onAdvancePhase}>
              <span>AVANÇAR FASE</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button className="dock-btn dock-btn-end" onClick={onEndTurn}>
              <span>ENCERRAR TURNO</span>
              <ChevronRight size={15} />
            </button>
          )}

          {phase !== 'movement' && (
            <button className="dock-btn dock-btn-end" onClick={onEndTurn} title="Pular direto para encerramento">
              <span>PASSAR TURNO</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
