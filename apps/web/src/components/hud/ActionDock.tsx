import { ArrowRight, ChevronRight, Shield, Swords, Truck } from 'lucide-react';
import './ActionDock.css';

interface ActionDockProps {
  phase: 'reinforcement' | 'attack' | 'movement';
  isMyTurn: boolean;
  reinforcementPool: number;
  onAdvancePhase: () => void;
  onEndTurn: () => void;

}

export function ActionDock({
  phase,
  isMyTurn,
  reinforcementPool,
  onAdvancePhase,
  onEndTurn,

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

      </div>

      {isMyTurn && (
        <div className="dock-actions-group">
          {phase !== 'movement' ? (
            <button className="dock-btn dock-btn-advance" onClick={onAdvancePhase} disabled={phase === 'reinforcement' && reinforcementPool > 0} title={phase === 'reinforcement' && reinforcementPool > 0 ? 'Distribua todos os reforços primeiro' : undefined}>
              <span>PRÓXIMA FASE</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button className="dock-btn dock-btn-end" onClick={onEndTurn}>
              <span>ENCERRAR TURNO</span>
              <ChevronRight size={15} />
            </button>
          )}


        </div>
      )}
    </div>
  );
}
