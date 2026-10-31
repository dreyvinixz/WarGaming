import { useEffect, useState } from 'react';
import { Minus, Plus, Shield, Swords, Truck, X } from 'lucide-react';
import { getTerritoryFlagCode } from '../map/territoryFlags';
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
  fighters: number;
  maxTroops: number;
  onConfirmAction: (troops: number, useFighter?: boolean) => void;
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
  fighters,
  maxTroops,
  onConfirmAction,
  onClose,
}: TerritoryInspectorProps) {
  const [lastSelection, setLastSelection] = useState(`${selectedTerritory?.id}-${targetTerritory?.id}-${phase}`);
  const [troops, setTroops] = useState<number>(() => (
    phase === 'reinforcement' ? Math.min(maxTroops, Math.max(1, maxTroops)) : Math.max(1, maxTroops)
  ));
  const [useFighter, setUseFighter] = useState(false);

  const currentSelection = `${selectedTerritory?.id}-${targetTerritory?.id}-${phase}`;
  if (currentSelection !== lastSelection) {
    setLastSelection(currentSelection);
    setTroops(phase === 'reinforcement' ? Math.min(maxTroops, Math.max(1, maxTroops)) : Math.max(1, maxTroops));
    setUseFighter(false);
  }
  useEffect(() => {
    setTroops(previous => Math.max(1, Math.min(maxTroops, previous)));
  }, [maxTroops]);

  if (!selectedTerritory) return null;

  const flagCode = getTerritoryFlagCode(selectedTerritory.id);

  const canCommit = isMyTurn && maxTroops > 0 && (
    (phase === 'reinforcement' && isMine) ||
    (phase === 'attack' && targetTerritory && isMine) ||
    (phase === 'movement' && targetTerritory && isMine)
  );


  const actionLabel = phase === 'reinforcement'
    ? 'ENVIAR REFORÇOS'
    : phase === 'attack'
    ? 'ATACAR'
    : 'MOVER TROPAS';

  const ActionIcon = phase === 'reinforcement' ? Shield : phase === 'attack' ? Swords : Truck;

  return (
    <aside className="territory-inspector" role="region" aria-label="Inspetor de Território">
      <div className="inspector-header">
        <span className="inspector-tag">
          <ActionIcon size={12} />
          <span>{targetTerritory ? 'CONFRONTO' : 'TERRITÓRIO'}</span>
        </span>
        <button className="inspector-close-btn" onClick={onClose} aria-label="Fechar painel">
          <X size={14} />
        </button>
      </div>

      <div className="inspector-body">
        <div className="inspector-territory-title">
          {flagCode && <img className="inspector-country-flag" src={`https://flagcdn.com/w80/${flagCode}.png`} alt={`Bandeira de ${selectedTerritory.name}`} />}
          <div className="inspector-territory-name">{selectedTerritory.name}</div>
        </div>

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
            <div className="matchup-vs">→</div>
            <div className="matchup-side target">
              <span>ALVO ({targetOwnerName ?? 'INIMIGO'})</span>
              <strong style={{ color: targetOwnerColor ?? '#ffd600' }}>
                {targetTerritory.name} ({targetTerritory.troops})
              </strong>
            </div>
          </div>
        )}

        {phase === 'attack' && targetTerritory && (
          <p className="inspector-combat-note">Cada troca elimina no máximo 1 tropa. Conquiste um território no turno para receber um caça ao encerrá-lo.</p>
        )}

        {isMyTurn && (
          <div className="inspector-action-box">
            {canCommit && (
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
                  <small>{phase === 'reinforcement' ? 'REFORÇOS' : phase === 'attack' ? 'FORÇA' : 'TROPAS'}</small>
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

            {phase === 'attack' && targetTerritory && fighters > 0 && isMine && (
              <label className="fighter-support-option">
                <input type="checkbox" checked={useFighter} onChange={event => setUseFighter(event.target.checked)} />
                <span className="fighter-support-icon" aria-hidden="true">✈</span>
                <span><strong>Apoio de caça</strong><small>+2 de força · {fighters} disponível(is)</small></span>
              </label>
            )}

            {canCommit ? (
              <button
                className={`inspector-commit-btn ${phase === 'attack' ? 'is-attack' : ''}`}
                onClick={() => onConfirmAction(troops, useFighter)}
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
                  phase === 'attack' ? 'São necessárias pelo menos 2 tropas para atacar.' : 'São necessárias pelo menos 2 tropas para manobrar.'
                )}
              </small>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
