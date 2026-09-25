import { useRef, useEffect, useState } from 'react';
import rawWorldMap from '@svg-maps/world';
import type { CSSProperties } from 'react';
import { TroopBadge } from './map/TroopBadge';
import { AttackRoute } from './map/AttackRoute';
import { TacticalOverlay } from './map/TacticalOverlay';
import './AtlasMap.css';

const worldMap = rawWorldMap as { viewBox: string; locations: Array<{ id: string; name: string; path: string }> };

const NODE_COUNTRY: Record<string, string> = {
  N1: 'ca', N2: 'us', N3: 'mx', I1: 'br', I2: 'ar', I3: 'cl',
  C1: 'fr', C2: 'de', C3: 'it', C4: 'eg', S1: 'za', S2: 'in', S3: 'au',
};

const NODE_POSITION: Record<string, [number, number]> = {
  N1: [153, 208], N2: [212, 280], N3: [232, 345], I1: [350, 470], I2: [300, 570], I3: [275, 585],
  C1: [481, 226], C2: [530, 228], C3: [510, 285], C4: [536, 378], S1: [520, 570], S2: [704, 365], S3: [840, 555],
};

const PLAYER_COLORS = ['#ffd600', '#00d9f5', '#8b4cc4', '#ff475d', '#71d88e', '#ef8c48'];

interface AtlasMapProps {
  matchState: any;
  selectedNode: string | null;
  targetNode: string | null;
  onNodeClick: (nodeId: string) => void;
  myPlayerId?: string | null;
  phase?: 'reinforcement' | 'attack' | 'movement';
}

export function AtlasMap({
  matchState,
  selectedNode,
  targetNode,
  onNodeClick,
  myPlayerId,
  phase,
}: AtlasMapProps) {
  // Track owners to trigger capture animation
  const prevOwnersRef = useRef<Record<string, string>>({});
  const [capturedNodes, setCapturedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!matchState?.territories) return;
    const currentTerritories = matchState.territories;
    const currentNodes = Object.keys(currentTerritories);
    const newlyCaptured = new Set<string>();

    currentNodes.forEach(nodeId => {
      const prevOwner = prevOwnersRef.current[nodeId];
      const currentOwner = currentTerritories[nodeId]?.owner_id;
      if (prevOwner && currentOwner && prevOwner !== currentOwner) {
        newlyCaptured.add(nodeId);
      }
    });

    if (newlyCaptured.size > 0) {
      setCapturedNodes(newlyCaptured);
      const timer = setTimeout(() => {
        setCapturedNodes(new Set());
      }, 1000);
      return () => clearTimeout(timer);
    }

    const currentOwnersMap: Record<string, string> = {};
    currentNodes.forEach(nodeId => {
      currentOwnersMap[nodeId] = currentTerritories[nodeId]?.owner_id;
    });
    prevOwnersRef.current = currentOwnersMap;
  }, [matchState]);

  if (!matchState?.territories) return null;

  const territories = matchState.territories;
  const nodes = Object.keys(territories);
  const playerIds = Object.keys(matchState.players ?? {}).sort();


  const getPlayerColor = (playerId: string | null) => {
    if (!playerId) return '#1b2a40';
    const index = playerIds.indexOf(playerId);
    return PLAYER_COLORS[index < 0 ? 0 : index % PLAYER_COLORS.length];
  };

  const nodeByCountry = Object.fromEntries(
    Object.entries(NODE_COUNTRY).map(([nodeId, countryId]) => [countryId, nodeId])
  );

  const drawEdges = new Set<string>();

  // Determine selectable and attackable nodes based on current state
  const selectedTerritory = selectedNode ? territories[selectedNode] : null;
  const selectedNeighbors: string[] = selectedTerritory?.neighbors ?? [];

  return (
    <div className="atlas-map-container">
      <svg
        viewBox={worldMap.viewBox}
        className="atlas-map-svg"
        role="group"
        aria-label="Mapa tático do Atlas War"
      >
        <defs>
          {/* Tactical Glow Filter */}
          <filter id="tacticalGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                0 0 0 0 0
                0 0 0 0 0.85
                0 0 0 0 1
                0 0 0 1 0"
              result="glowColor"
            />
            <feMerge>
              <feMergeNode in="glowColor" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Directional Arrow Marker for Attacks */}
          <marker
            id="attackArrowMarker"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#ffd600" />
          </marker>

          {/* Directional Arrow Marker for Movements */}
          <marker
            id="moveArrowMarker"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#00d9f5" />
          </marker>
        </defs>

        {/* Tactical Coordinate Grid and Atmosphere */}
        <TacticalOverlay />

        {/* Base Strategic Edges Between Neighbors */}
        <g className="atlas-edges" aria-hidden="true">
          {nodes.flatMap(nodeId =>
            ((territories[nodeId].neighbors ?? []) as string[]).map((neighborId: string) => {
              const edgeId = [nodeId, neighborId].sort().join('-');
              if (drawEdges.has(edgeId) || !NODE_POSITION[nodeId] || !NODE_POSITION[neighborId]) return null;
              drawEdges.add(edgeId);
              const [x1, y1] = NODE_POSITION[nodeId];
              const [x2, y2] = NODE_POSITION[neighborId];
              return <line key={edgeId} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })
          )}
        </g>

        {/* Dynamic Vector Lines (Marching Ants) for Active Action Paths */}
        {selectedNode && NODE_POSITION[selectedNode] && (
          <g className="tactical-active-routes">
            {selectedNeighbors.map(neighborId => {
              const neighbor = territories[neighborId];
              if (!neighbor || !NODE_POSITION[neighborId]) return null;

              const isEnemy = neighbor.owner_id !== territories[selectedNode].owner_id;
              const isTarget = neighborId === targetNode;

              if (phase === 'attack' && isEnemy) {
                return (
                  <AttackRoute
                    key={`route-${selectedNode}-${neighborId}`}
                    sourcePos={NODE_POSITION[selectedNode]}
                    targetPos={NODE_POSITION[neighborId]}
                    type="attack"
                    isEngaged={isTarget}
                  />
                );
              }

              if (phase === 'movement' && !isEnemy) {
                return (
                  <AttackRoute
                    key={`route-${selectedNode}-${neighborId}`}
                    sourcePos={NODE_POSITION[selectedNode]}
                    targetPos={NODE_POSITION[neighborId]}
                    type="movement"
                    isEngaged={isTarget}
                  />
                );
              }

              return null;
            })}
          </g>
        )}

        {/* Geographic Country Paths with Visual State Machine */}
        <g className="atlas-countries">
          {worldMap.locations.map(location => {
            const nodeId = nodeByCountry[location.id];
            const territory = nodeId ? territories[nodeId] : undefined;
            const isPlayable = Boolean(nodeId && territory);

            if (!isPlayable) {
              return <path key={location.id} d={location.path} className="atlas-country" />;
            }

            const color = getPlayerColor(territory.owner_id);
            const isSelected = nodeId === selectedNode;
            const isTarget = nodeId === targetNode;
            const isMine = territory.owner_id === myPlayerId;

            // Attackable: enemy neighbor of selected node
            const isAttackable = Boolean(
              phase === 'attack' &&
              selectedNode &&
              selectedNeighbors.includes(nodeId) &&
              !isMine
            );

            // Selectable in current phase
            const isSelectable = Boolean(
              (phase === 'reinforcement' && isMine) ||
              (phase === 'attack' && ((!selectedNode && isMine && territory.troops > 1) || isAttackable)) ||
              (phase === 'movement' && ((!selectedNode && isMine && territory.troops > 1) || (selectedNode && selectedNeighbors.includes(nodeId) && isMine)))
            );

            const isRecentlyCaptured = capturedNodes.has(nodeId);

            const classNames = [
              'atlas-country',
              'is-playable',
              isSelected && 'is-selected',
              isTarget && 'is-target',
              isAttackable && 'is-attackable',
              isSelectable && !isSelected && 'is-selectable',
              isRecentlyCaptured && 'is-recently-captured',
            ].filter(Boolean).join(' ');

            return (
              <path
                key={location.id}
                d={location.path}
                className={classNames}
                style={{ '--territory-color': color } as CSSProperties}
                tabIndex={0}
                role="button"
                aria-label={`${territory.name}, ${territory.troops} tropas`}
                onClick={() => onNodeClick(nodeId)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onNodeClick(nodeId);
                  }
                }}
              />
            );
          })}
        </g>

        {/* Military Troop Badges */}
        <g className="atlas-troop-badges">
          {nodes.map(nodeId => {
            const territory = territories[nodeId];
            const position = NODE_POSITION[nodeId];
            if (!position) return null;

            const color = getPlayerColor(territory.owner_id);
            const [x, y] = position;
            const isSelected = nodeId === selectedNode;
            const isTarget = nodeId === targetNode;
            const isMine = territory.owner_id === myPlayerId;

            const isAttackable = Boolean(
              phase === 'attack' &&
              selectedNode &&
              selectedNeighbors.includes(nodeId) &&
              !isMine
            );

            const isSelectable = Boolean(
              (phase === 'reinforcement' && isMine) ||
              (phase === 'attack' && ((!selectedNode && isMine && territory.troops > 1) || isAttackable)) ||
              (phase === 'movement' && ((!selectedNode && isMine && territory.troops > 1) || (selectedNode && selectedNeighbors.includes(nodeId) && isMine)))
            );

            return (
              <TroopBadge
                key={nodeId}
                nodeId={nodeId}
                troops={territory.troops}
                color={color}
                isSelected={isSelected}
                isTarget={isTarget}
                isSelectable={isSelectable}
                x={x}
                y={y}
                onClick={onNodeClick}
                name={territory.name}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
