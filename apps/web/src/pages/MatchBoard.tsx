import { useState } from 'react';
import { TopStatusBar } from '../components/hud/TopStatusBar';
import { PhaseBanner } from '../components/hud/PhaseBanner';
import { ActionDock } from '../components/hud/ActionDock';
import { ObjectiveBadge } from '../components/hud/ObjectiveBadge';
import { TerritoryInspector } from '../components/hud/TerritoryInspector';
import { GameLogDrawer, GameLogTrigger } from '../components/hud/GameLogDrawer';
import { AtlasMap } from '../components/AtlasMap';
import { ActionModal } from '../components/ActionModal';
import { Onboarding } from '../components/Onboarding';
import { useGameStore } from '../store/useGameStore';
import { sendAction } from '../services/ws';
import './MatchBoard.css';

type PhaseType = 'reinforcement' | 'attack' | 'movement';

const PLAYER_COLORS = ['#ffd600', '#00d9f5', '#8b4cc4', '#ff475d', '#71d88e', '#ef8c48'];

function territoryName(matchState: any, nodeId: string | null) {
  return nodeId ? matchState?.territories?.[nodeId]?.name ?? nodeId : 'território';
}

export function MatchBoard() {
  const { matchState, playerName } = useGameStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  if (!matchState) return null;

  const playerIds = Object.keys(matchState.players ?? {}).sort();
  const currentPlayerId = matchState.current_player_id;
  const isMyTurn = matchState.players[currentPlayerId]?.name === playerName;
  const myPlayerId = Object.keys(matchState.players).find(id => matchState.players[id].name === playerName);
  const myPlayer = matchState.players[myPlayerId ?? ''];
  const phase = (matchState.phase as PhaseType) ?? 'reinforcement';

  const getPlayerColor = (playerId: string | null) => {
    if (!playerId) return '#1b2a40';
    const index = playerIds.indexOf(playerId);
    return PLAYER_COLORS[index < 0 ? 0 : index % PLAYER_COLORS.length];
  };

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
        if ((myPlayer?.reinforcement_pool ?? 0) > 0) {
          setModalOpen(true);
        }
      }
      return;
    }

    if (phase === 'attack' || phase === 'movement') {
      if (!selectedNode) {
        if (isMine && territory.troops > 1) {
          setSelectedNode(nodeId);
        } else {
          setSelectedNode(nodeId);
        }
        return;
      }

      if (nodeId === selectedNode) {
        setSelectedNode(null);
        setTargetNode(null);
        return;
      }

      const neighbors: string[] = matchState.territories[selectedNode]?.neighbors || [];
      if (neighbors.includes(nodeId)) {
        setTargetNode(nodeId);
        setModalOpen(true);
      } else if (isMine && territory.troops > 1) {
        setSelectedNode(nodeId);
        setTargetNode(null);
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
    }

    if (phase === 'movement' && selectedNode && targetNode) {
      sendAction('move_troops', { source_id: selectedNode, target_id: targetNode, moving_troops: troops });
      setSelectedNode(null);
      setTargetNode(null);
    }

    setModalOpen(false);
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
    : selectedTerritory
    ? Math.max(1, selectedTerritory.troops - 1)
    : 1;

  const isSelectedMine = selectedTerritory?.owner_id === myPlayerId;
  const actionTitle = phase === 'reinforcement'
    ? 'Enviar reforços'
    : phase === 'attack'
    ? 'Iniciar ataque'
    : 'Mover tropas';

  const actionDescription = phase === 'reinforcement'
    ? `Escolha quantas tropas enviar para ${territoryName(matchState, selectedNode)}.`
    : `${territoryName(matchState, selectedNode)} → ${territoryName(matchState, targetNode)}`;

  return (
    <div className="match-screen">
      {/* 1. Military Top Status Bar */}
      <TopStatusBar
        roomCode={matchState.room_code}
        roundNumber={matchState.round_number}
        isMyTurn={isMyTurn}
        currentPlayerName={matchState.players[currentPlayerId]?.name ?? 'Outro Jogador'}
        reinforcementPool={myPlayer?.reinforcement_pool ?? 0}
        onOpenTutorial={() => setTutorialOpen(true)}
      />

      {/* 2. Full-Viewport Battlefield Canvas */}
      <main className="match-viewport">
        {/* Floating Contextual Phase Banner */}
        <PhaseBanner phase={phase} isMyTurn={isMyTurn} />

        {/* 100% SVG World Map */}
        <AtlasMap
          matchState={matchState}
          selectedNode={selectedNode}
          targetNode={targetNode}
          onNodeClick={handleNodeClick}
          myPlayerId={myPlayerId}
          phase={phase}
        />

        {/* Floating Contextual Territory Inspector (Opens on Selection) */}
        {selectedTerritory && (
          <TerritoryInspector
            key={`${selectedNode}-${targetNode ?? 'none'}-${phase}`}
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
        />

        {/* Floating Bottom Center Action Dock */}
        <ActionDock
          phase={phase}
          isMyTurn={isMyTurn}
          onAdvancePhase={handleAdvance}
          onEndTurn={handleEndTurn}
          onToggleObjective={() => setTutorialOpen(true)}
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

      {/* 5. Optional Deep Action Modal (if needed for granular confirmation) */}
      {modalOpen && (
        <ActionModal
          title={actionTitle}
          description={actionDescription}
          maxTroops={maxTroops}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setModalOpen(false);
            setTargetNode(null);
          }}
        />
      )}
    </div>
  );
}
