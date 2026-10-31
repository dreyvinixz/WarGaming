import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { TopStatusBar } from '../components/hud/TopStatusBar';
import { PhaseBanner } from '../components/hud/PhaseBanner';
import { ActionDock } from '../components/hud/ActionDock';
import { ObjectiveBadge } from '../components/hud/ObjectiveBadge';
import { TerritoryInspector } from '../components/hud/TerritoryInspector';
import { GameLogDrawer, GameLogTrigger } from '../components/hud/GameLogDrawer';
import { AtlasMap } from '../components/AtlasMap';
import { Onboarding } from '../components/Onboarding';
import { useGameStore } from '../store/useGameStore';
import { sendAction, disconnectWebSocket } from '../services/ws';
import './MatchBoard.css';

type PhaseType = 'reinforcement' | 'attack' | 'movement';

const PLAYER_COLORS = ['#EF534F', '#49A3D9', '#34B78F', '#A78BFA', '#F59E0B', '#E2E8F0'];

export function MatchBoard() {
  const { matchState, playerName, error, setError, reset, saveAndExit, isConnected } = useGameStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [battle, setBattle] = useState<any>(null);
  const [battleResultVisible, setBattleResultVisible] = useState(false);
  const previousState = useRef<any>(null);
  const timeoutRequestRef = useRef<{ deadline: string | null; sentAt: number }>({ deadline: null, sentAt: 0 });
  const [clockNow, setClockNow] = useState(Date.now());
  const deadlineAt = matchState?.phase_deadline_at as string | null | undefined;
  const deadlineMs = deadlineAt ? Date.parse(deadlineAt) : NaN;
  const secondsRemaining = Number.isFinite(deadlineMs) ? Math.max(0, Math.ceil((deadlineMs - clockNow) / 1000)) : null;
  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!isConnected || secondsRemaining !== 0 || !deadlineAt) return;
    if (timeoutRequestRef.current.deadline === deadlineAt && clockNow - timeoutRequestRef.current.sentAt < 3000) return;
    timeoutRequestRef.current = { deadline: deadlineAt, sentAt: clockNow };
    sendAction('phase_timeout');
  }, [clockNow, deadlineAt, isConnected, secondsRemaining]);
  useEffect(() => {
    const previous = previousState.current;
    previousState.current = matchState;
    if (!matchState || !previous || previous.match_id !== matchState.match_id) return;
    const oldIds = new Set((previous.action_log ?? []).map((entry: any) => entry.id));
    const entry = (matchState.action_log ?? []).find((item: any) => !oldIds.has(item.id) && (item.type === 'attack_success' || item.type === 'attack_failed'));
    if (!entry) return;
    const payload = entry.payload ?? {};
    const defenderId = previous.territories?.[payload.target_id]?.owner_id;
    setBattle({ ...payload, animationId: entry.id, attackerColor: previous.players?.[entry.player_id]?.color ?? '#CF3630', defenderColor: previous.players?.[defenderId]?.color ?? '#49A3D9', won: entry.type === 'attack_success', attacker: previous.players?.[entry.player_id]?.name ?? 'Atacante', defender: previous.players?.[defenderId]?.name ?? 'Defensor', source: previous.territories?.[payload.source_id]?.name ?? 'Origem', target: previous.territories?.[payload.target_id]?.name ?? 'Destino' });
  }, [matchState]);

  useEffect(() => {
    if (!battle) {
      setBattleResultVisible(false);
      return;
    }
    setBattleResultVisible(false);
    const timer = setTimeout(() => setBattleResultVisible(true), 2050);
    return () => clearTimeout(timer);
  }, [battle]);

  if (!matchState) return null;

  const playerIds = Object.keys(matchState.players ?? {}).sort();
  const currentPlayerId = matchState.current_player_id;
  const isMyTurn = matchState.players[currentPlayerId]?.name === playerName;
  const myPlayerId = Object.keys(matchState.players).find(id => matchState.players[id].name === playerName);
  const myPlayer = matchState.players[myPlayerId ?? ''];
  const phase = (matchState.phase as PhaseType) ?? 'reinforcement';

  const getPlayerColor = (playerId: string | null) => {
    if (!playerId) return '#101C29';
    const index = playerIds.indexOf(playerId);
    return matchState.players[playerId]?.color ?? PLAYER_COLORS[index < 0 ? 0 : index % PLAYER_COLORS.length];
  };

  const armyColor = getPlayerColor(myPlayerId ?? null);
  const armyColorRgb = /^#[\da-f]{6}$/i.test(armyColor)
    ? [1, 3, 5].map(offset => parseInt(armyColor.slice(offset, offset + 2), 16))
    : null;
  const armyTextColor = armyColorRgb && (armyColorRgb[0] * 299 + armyColorRgb[1] * 587 + armyColorRgb[2] * 114) / 1000 > 150
    ? '#090909'
    : '#FFFFFF';
  const matchThemeStyle = {
    '--army-color': armyColor,
    '--army-ink': armyTextColor,
    '--accent-primary': armyColor,
    '--accent-primary-hover': `color-mix(in srgb, ${armyColor} 78%, white)`,
    '--accent-selection': armyColor,
    '--yellow': armyColor,
    '--red': armyColor,
    '--cyan': armyColor,
  } as CSSProperties;

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return 'Neutro';
    return matchState.players[playerId]?.name ?? 'Comandante';
  };

  const selectedTerritory = selectedNode ? matchState.territories[selectedNode] : null;
  const targetTerritory = targetNode ? matchState.territories[targetNode] : null;

  const controlledCount = Object.values(matchState.territories).filter(
    (territory: any) => territory.owner_id === myPlayerId
  ).length;

  const troopCount = Object.values(matchState.territories)
    .filter((territory: any) => territory.owner_id === myPlayerId)
    .reduce((total: number, territory: any) => total + territory.troops, 0);

  const totalTerritories = Object.keys(matchState.territories).length || 13;

  const isSelectedMine = selectedTerritory?.owner_id === myPlayerId;

  const handleNodeClick = (nodeId: string) => {
    const territory = matchState.territories[nodeId];
    if (!territory) return;
    const isMine = territory.owner_id === myPlayerId;

    if (!isMyTurn) {
      // In observation mode, clicking inspects the territory
      setSelectedNode(nodeId === selectedNode ? null : nodeId);
      setTargetNode(null);
      return;
    }

    if (phase === 'reinforcement') {
      if (isMine) {
        setSelectedNode(nodeId);
        setTargetNode(null);
      } else {
        setSelectedNode(nodeId);
        setTargetNode(null);
      }
      return;
    }

    if (phase === 'attack') {
      // Clicking already selected territory deselects it
      if (nodeId === selectedNode) {
        setSelectedNode(null);
        setTargetNode(null);

        return;
      }

      // If clicking one of my own territories, select/switch attack origin
      if (isMine) {
        setSelectedNode(nodeId);
        setTargetNode(null);

        return;
      }

      // If clicking an enemy territory
      if (!isMine) {
        const sourceTerritory = selectedNode ? matchState.territories[selectedNode] : null;
        const isSourceMine = sourceTerritory?.owner_id === myPlayerId;
        const sourceNeighbors: string[] = sourceTerritory?.neighbors || [];

        if (selectedNode && isSourceMine && (sourceTerritory?.troops ?? 0) > 1 && sourceNeighbors.includes(nodeId)) {
          // Valid adjacent enemy target!
          setTargetNode(nodeId);

        } else {
          // Inspect enemy territory without attacking
          setSelectedNode(nodeId);
          setTargetNode(null);

        }
        return;
      }
    }

    if (phase === 'movement') {
      if (nodeId === selectedNode) {
        setSelectedNode(null);
        setTargetNode(null);

        return;
      }

      if (isMine) {
        const sourceTerritory = selectedNode ? matchState.territories[selectedNode] : null;
        const isSourceMine = sourceTerritory?.owner_id === myPlayerId;
        const sourceNeighbors: string[] = sourceTerritory?.neighbors || [];

        if (selectedNode && isSourceMine && (sourceTerritory?.troops ?? 0) > 1 && sourceNeighbors.includes(nodeId)) {
          // Valid movement target!
          setTargetNode(nodeId);

        } else {
          // Switch source
          setSelectedNode(nodeId);
          setTargetNode(null);

        }
        return;
      } else {
        // Inspect enemy territory
        setSelectedNode(nodeId);
        setTargetNode(null);

        return;
      }
    }
  };

  const handleConfirmAction = (troops: number) => {
    if (phase === 'reinforcement' && selectedNode) {
      sendAction('place_reinforcement', { territory_id: selectedNode, troops });
      if ((myPlayer?.reinforcement_pool ?? 0) - troops <= 0) {
        setSelectedNode(null);
      }
    }

    if (phase === 'attack' && selectedNode && targetNode) {
      sendAction('attack', { source_id: selectedNode, target_id: targetNode, attacking_troops: troops });
      setTargetNode(null);
      if ((selectedTerritory?.troops ?? 0) - troops < 2) {
        setSelectedNode(null);
      }
    }

    if (phase === 'movement' && selectedNode && targetNode) {
      sendAction('move_troops', { source_id: selectedNode, target_id: targetNode, troops });
      setSelectedNode(null);
      setTargetNode(null);
    }

  };

  const handleAdvance = () => {
    sendAction('advance_phase');
    setSelectedNode(null);
    setTargetNode(null);
  };

  const handleEndTurn = () => {
    sendAction('end_turn');
    setSelectedNode(null);
    setTargetNode(null);
  };

  // Max troops for stepper/action
  const maxTroops = phase === 'reinforcement'
    ? myPlayer?.reinforcement_pool ?? 0
    : isSelectedMine && selectedTerritory
    ? Math.max(1, selectedTerritory.troops - 1)
    : 1;

  return (
    <div className="match-screen" style={matchThemeStyle}>
      {battle && battleResultVisible && <div className="battle-backdrop" role="presentation"><section className="battle-result" role="dialog" aria-modal="true" aria-labelledby="battle-title"><div className="battle-header">RELATÓRIO DE COMBATE</div><h2 id="battle-title">{battle.won ? 'Território conquistado' : 'Ataque repelido'}</h2><p className="battle-route">{battle.source} <span>→</span> {battle.target}</p><div className="battle-forces"><div><small>ATACANTE</small><strong>{battle.attacker}</strong><div className="battle-die">{battle.attack_roll}</div><span>Força total: {battle.attack_power}</span><b>Perdas: {battle.attacking_troops_lost}</b></div><span className="battle-versus">VS</span><div><small>DEFENSOR</small><strong>{battle.defender}</strong><div className="battle-die defense">{battle.defense_roll}</div><span>Força total: {battle.defense_power}</span><b>Perdas: {battle.defending_troops_lost}</b></div></div><p className="battle-rule">Força total = tropas + dado. O defensor vence empates.</p><button onClick={() => setBattle(null)}>Continuar partida</button></section></div>}
      {exitOpen && <div className="victory-overlay" role="dialog" aria-modal="true" aria-labelledby="exit-title"><div><h1 id="exit-title">Voltar ao início?</h1><p>Sua vaga permanece na partida. Você poderá retomá-la neste navegador; os demais jogadores podem precisar aguardar seu turno.</p><button onClick={() => setExitOpen(false)}>Continuar jogando</button> <button onClick={() => { disconnectWebSocket(); saveAndExit(); }}>Voltar ao início</button></div></div>}
      {error && <div role="alert" className="match-error">{error} <button onClick={() => setError('')}>Fechar</button></div>}
      {!isConnected && <div role="status" className="match-error">Conexão perdida. Tentando reconectar…</div>}
      {matchState.phase === 'finished' && <div className="victory-overlay" role="dialog" aria-modal="true"><div><h1>Partida encerrada</h1><p>Vencedor: {matchState.players[matchState.winner_player_id]?.name ?? 'Jogador'}</p><button onClick={reset}>Voltar ao início</button></div></div>}
      {/* 1. Military Top Status Bar */}
      <TopStatusBar
        roomCode={matchState.room_code}
        roundNumber={matchState.round_number}
        isMyTurn={isMyTurn}
        currentPlayerName={matchState.players[currentPlayerId]?.name ?? 'Outro Jogador'}
        reinforcementPool={myPlayer?.reinforcement_pool ?? 0}
        onOpenTutorial={() => setTutorialOpen(true)}
        onExitMatch={() => setExitOpen(true)}
      />

      {/* 2. Full-Viewport Battlefield Canvas */}
      <main className="match-viewport">
        <div className="command-players" aria-label="Comandantes da partida">{playerIds.map(id => <div className={`command-player ${id === currentPlayerId ? 'active' : ''}`} key={id}><span className="command-player__medal" style={{ backgroundColor: getPlayerColor(id) }}><img src="/assets/ui/atlas-crest.svg" alt="" /><b>{matchState.players[id].name.slice(0, 1).toUpperCase()}</b></span><span><strong>{matchState.players[id].name}{id === myPlayerId ? ' · você' : ''}</strong><small>{id === currentPlayerId ? 'Jogando agora' : 'Aguardando'}</small></span></div>)}</div>
        {/* Floating Contextual Phase Banner */}
        <PhaseBanner phase={phase} isMyTurn={isMyTurn} secondsRemaining={secondsRemaining} />

        {/* 100% SVG World Map */}
        <AtlasMap
          matchState={matchState}
          selectedNode={selectedNode}
          targetNode={targetNode}
          onNodeClick={handleNodeClick}
          myPlayerId={myPlayerId}
          phase={phase}
          battleAnimation={battle}
        />

        {/* Floating Contextual Territory Inspector (Opens on Selection) */}
        {selectedTerritory && (
          <TerritoryInspector
            selectedTerritory={selectedTerritory}
            targetTerritory={targetTerritory}
            phase={phase}
            isMyTurn={isMyTurn}
            isMine={isSelectedMine}
            ownerName={getPlayerName(selectedTerritory.owner_id)}
            ownerColor={getPlayerColor(selectedTerritory.owner_id)}
            targetOwnerName={targetTerritory ? getPlayerName(targetTerritory.owner_id) : undefined}
            targetOwnerColor={targetTerritory ? getPlayerColor(targetTerritory.owner_id) : undefined}
            maxTroops={maxTroops}
            onConfirmAction={handleConfirmAction}
            onClose={() => {
              setSelectedNode(null);
              setTargetNode(null);
            }}
          />
        )}


        {/* Floating Bottom Left Objective Widget */}
        <ObjectiveBadge
          controlledCount={controlledCount}
          troopCount={troopCount}
          totalTerritories={totalTerritories}
          objective={matchState.objectives?.[myPlayer?.objective_id]}
        />

        {/* Floating Bottom Center Action Dock */}
        <ActionDock
          phase={phase}
          isMyTurn={isMyTurn}
          reinforcementPool={myPlayer?.reinforcement_pool ?? 0}
          onAdvancePhase={handleAdvance}
          onEndTurn={handleEndTurn}
        />

        {/* Floating Bottom Right Game Log Trigger */}
        <div className="match-log-trigger-anchor">
          <GameLogTrigger
            onClick={() => setLogDrawerOpen(true)}
            count={(matchState.action_log ?? []).length}
          />
        </div>
      </main>

      {/* 3. Retractable Game Log Drawer */}
      <GameLogDrawer
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        logs={matchState.action_log ?? []}
      />

      {/* 4. Onboarding / Mission Briefing Modal */}
      <Onboarding
        phase={phase}
        selectedNode={selectedNode}
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />

    </div>
  );
}
