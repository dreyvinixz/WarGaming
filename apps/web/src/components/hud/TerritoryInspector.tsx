import { useState } from 'react';
import { Minus, Plus, Shield, Swords, Truck, X } from 'lucide-react';
import './TerritoryInspector.css';

interface TerritoryInspectorProps {
  selectedTerritory: any;
  targetTerritory: any | null;
  phase: 'reinforcement' | 'attack' | 'movement';
  isMyTurn: boolean;
  isMine: boolean;
  ownerName: string;
  ownerColor: string;
  targetOwnerName?: string;
  targetOwnerColor?: string;
  maxTroops: number;
  onConfirmAction: (troops: number) => void;
  onClose: () => void;
}

export function TerritoryInspector({
  selectedTerritory,
  targetTerritory,
  phase,
  isMyTurn,
  isMine,
  ownerName,
  ownerColor,
  targetOwnerName,
  targetOwnerColor,
  maxTroops,
  onConfirmAction,
  onClose,
}: TerritoryInspectorProps) {
  const [troops, setTroops] = useState<number>(() => (
    phase === 'reinforcement' ? Math.min(maxTroops, Math.max(1, maxTroops)) : 1
  ));


  if (!selectedTerritory) return null;

  const canCommit = isMyTurn && maxTroops > 0 && (
    (phase === 'reinforcement' && isMine) ||
    (phase === 'attack' && targetTerritory) ||
    (phase === 'movement' && targetTerritory)
  );

  const actionLabel = phase === 'reinforcement'
    ? 'ENVIAR REFORÇOS'
    : phase === 'attack'
    ? 'DISPARAR ATAQUE'
    : 'MOVER TROPAS';

  const ActionIcon = phase === 'reinforcement' ? Shield : phase === 'attack' ? Swords : Truck;

  return (
    <aside className="territory-inspector" role="region" aria-label="Inspetor de Território">
      <div className="inspector-header">
        <span className="inspector-tag">
          <ActionIcon size={12} />
          <span>{targetTerritory ? 'ENGAGEMENT TÁTICO' : 'INSPEÇÃO DE SETOR'}</span>
        </span>
        <button className="inspector-close-btn" onClick={onClose} aria-label="Fechar painel">
          <X size={14} />
        </button>
      </div>

      <div className="inspector-body">
        <div className="inspector-territory-name">{selectedTerritory.name}</div>

        <div className="inspector-status-row">
          <div className="inspector-owner-badge">
            <span className="inspector-owner-dot" style={{ backgroundColor: ownerColor }} />
            <span>{ownerName}</span>
          </div>
          <div className="inspector-troops-count">
            <span>{selectedTerritory.troops}</span>
            <small>tropas</small>
          </div>
        </div>

        {targetTerritory && (
          <div className="inspector-matchup">
            <div className="matchup-side">
              <span>ORIGEM</span>
              <strong>{selectedTerritory.name} ({selectedTerritory.troops})</strong>
            </div>
            <div className="matchup-vs">VS</div>
            <div className="matchup-side target">
              <span>ALVO ({targetOwnerName ?? 'INIMIGO'})</span>
              <strong style={{ color: targetOwnerColor ?? '#ffd600' }}>
                {targetTerritory.name} ({targetTerritory.troops})
              </strong>
            </div>
          </div>
        )}

        {isMyTurn && (
          <div className="inspector-action-box">
            {canCommit && maxTroops > 1 && (
              <div className="troop-stepper">
                <button
                  className="stepper-btn"
                  onClick={() => setTroops((prev: number) => Math.max(1, prev - 1))}
                  disabled={troops <= 1}
                >
                  <Minus size={14} />
                </button>
                <div className="stepper-display">
                  <strong>{troops}</strong>
                  <small>{phase === 'reinforcement' ? 'REFORÇOS' : 'TROPAS'}</small>
                </div>
                <button
                  className="stepper-btn"
                  onClick={() => setTroops((prev: number) => Math.min(maxTroops, prev + 1))}
                  disabled={troops >= maxTroops}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {canCommit ? (
              <button
                className={`inspector-commit-btn ${phase === 'attack' ? 'is-attack' : ''}`}
                onClick={() => onConfirmAction(troops)}
              >
                <ActionIcon size={14} />
                <span>{actionLabel}</span>
              </button>
            ) : (
              <small style={{ color: '#6d86a4', textAlign: 'center', fontSize: '10px' }}>
                {phase === 'attack' && !targetTerritory && selectedTerritory.troops > 1 && (
                  'Clique em um território inimigo vizinho para atacar.'
                )}
                {phase === 'movement' && !targetTerritory && selectedTerritory.troops > 1 && (
                  'Clique em um território aliado conectado para mover.'
                )}
                {selectedTerritory.troops <= 1 && phase !== 'reinforcement' && (
                  'Território sem tropas suficientes para manobra (mínimo 2).'
                )}
              </small>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
