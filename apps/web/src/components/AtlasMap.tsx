import { useRef, useEffect, useState } from 'react';
import rawWorldMap from '@svg-maps/world';
import type { CSSProperties, WheelEvent, PointerEvent } from 'react';
import { TroopBadge } from './map/TroopBadge';
import { AttackRoute } from './map/AttackRoute';
import { TacticalOverlay } from './map/TacticalOverlay';
import { BattleAnimation } from './map/BattleAnimation';
import { TERRITORY_FLAGS } from './map/territoryFlags';
import geographicMap from './map/world_v2.json';
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

const PLAYER_COLORS = ['#EF534F', '#49A3D9', '#34B78F', '#A78BFA', '#F59E0B', '#E2E8F0'];

interface AtlasMapProps {
  matchState: any;
  selectedNode: string | null;
  targetNode: string | null;
  onNodeClick: (nodeId: string) => void;
  myPlayerId?: string | null;
  phase?: 'reinforcement' | 'attack' | 'movement';
  battleAnimation?: any;
}

export function AtlasMap({
  matchState,
  selectedNode,
  targetNode,
  onNodeClick,
  myPlayerId,
  phase,
  battleAnimation,
}: AtlasMapProps) {
  // Track owners to trigger capture animation
  const prevOwnersRef = useRef<Record<string, string>>({});
  const [capturedNodes, setCapturedNodes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [listOpen, setListOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const dragMoved = useRef(false);
  const [dragging, setDragging] = useState(false);
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left + event.currentTarget.scrollLeft;
    const py = event.clientY - box.top + event.currentTarget.scrollTop;
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    const next = Math.min(2.5, Math.max(0.75, zoom * factor));
    setZoom(next);
    requestAnimationFrame(() => { const el = scrollRef.current; if (el) { el.scrollLeft = px * next / zoom - (event.clientX - box.left); el.scrollTop = py * next / zoom - (event.clientY - box.top); } });
  };
  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('[role="button"],button')) return;
    dragRef.current = { x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop };
    dragMoved.current = false; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pan = (event: PointerEvent<HTMLDivElement>) => { const start = dragRef.current; if (!start) return; if (Math.abs(event.clientX-start.x)+Math.abs(event.clientY-start.y)>3) dragMoved.current=true; event.currentTarget.scrollLeft=start.left-(event.clientX-start.x); event.currentTarget.scrollTop=start.top-(event.clientY-start.y); };
  const endPan = () => { dragRef.current=null; setDragging(false); setTimeout(()=>{dragMoved.current=false},0); };

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
  const battlePosition = (territoryId: string): [number, number] | null => {
    if (matchState.map_id === 'atlas_world_v2') {
      const geo = geographicMap[territoryId as keyof typeof geographicMap];
      return geo ? [geo.x, geo.y] : null;
    }
    if (matchState.map_id === 'atlas_world_v1') {
      const territory = matchState.territories[territoryId];
      return territory ? [12 + territory.x * 118 + 56, 12 + territory.y * 126 + 60] : null;
    }
    return NODE_POSITION[territoryId] ?? null;
  };
  const battleSource = battleAnimation ? battlePosition(battleAnimation.source_id) : null;
  const battleTarget = battleAnimation ? battlePosition(battleAnimation.target_id) : null;
  const playerColor = (playerId: string | null, fallbackIndex = 0) => {
    const chosen = playerId ? matchState.players?.[playerId]?.color : null;
    return chosen || PLAYER_COLORS[fallbackIndex % PLAYER_COLORS.length];
  };
  if (matchState.map_id === 'atlas_world_v1' || matchState.map_id === 'atlas_world_v2') {
    const players = Object.keys(matchState.players).sort();
    const source = selectedNode ? matchState.territories[selectedNode] : null;
    return <div className="world-board-shell">
      <img className="world-compass-rose" src="/assets/map/compass-rose.svg" alt="" aria-hidden="true" />
      <div className="world-map-tools" role="group" aria-label="Navegação do mapa">
        <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.25))} disabled={zoom <= 1} aria-label="Diminuir zoom">−</button><span aria-live="polite">{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(z => Math.min(2, z + 0.25))} disabled={zoom >= 2} aria-label="Aumentar zoom">+</button><button type="button" aria-expanded={listOpen} onClick={() => setListOpen(open => !open)}>Territórios</button>
      </div>
      {listOpen && <div className="world-territory-list" role="region" aria-label="Lista de territórios"><div className="world-list-heading">Selecione um território <button type="button" onClick={() => setListOpen(false)} aria-label="Fechar lista">×</button></div>{Object.values(matchState.regions).map((region: any) => <section key={region.id}><h3>{region.name} · bônus +{region.bonus_troops}</h3>{region.territory_ids.map((id: string) => { const t = matchState.territories[id]; if (!t) return null; return <button type="button" className={selectedNode === id ? 'active' : ''} key={id} onClick={() => { onNodeClick(id); setListOpen(false); }}><span>{t.name}</span><small>{matchState.players[t.owner_id]?.name ?? 'Neutro'} · {t.troops} tropas</small></button>; })}</section>)}</div>}
      <div ref={scrollRef} className={`world-board-scroll ${dragging ? 'is-dragging' : ''}`} tabIndex={0} aria-label="Mapa: arraste para deslocar; Ctrl+roda para ampliar" onWheel={handleWheel} onPointerDown={startPan} onPointerMove={pan} onPointerUp={endPan} onPointerCancel={endPan}>
      <svg className="world-board" style={{ width: matchState.map_id === 'atlas_world_v2' ? `max(${850 * zoom}px, min(${100 * zoom}vw, calc(${138.46 * zoom}vh - ${328.15 * zoom}px)))` : `${zoom * 100}%`, minWidth: `${zoom * 850}px` }} viewBox={matchState.map_id === 'atlas_world_v2' ? "182 114 720 520" : "0 0 1080 520"} role="group" aria-label="Tabuleiro territorial Atlas War">
        {matchState.map_id === 'atlas_world_v2' && source && source.owner_id === myPlayerId && source.troops > 1 && (phase === 'attack' || phase === 'movement') && <g className="map-valid-routes" aria-hidden="true">{source.neighbors.map((neighborId: string) => { const neighbor = matchState.territories[neighborId]; const from = geographicMap[selectedNode as keyof typeof geographicMap]; const to = geographicMap[neighborId as keyof typeof geographicMap]; if (!from || !to || !neighbor || (phase === 'attack' ? neighbor.owner_id === myPlayerId : neighbor.owner_id !== myPlayerId)) return null; return <line key={neighborId} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />; })}</g>}
        {matchState.map_id === 'atlas_world_v2' ? Object.values(matchState.territories).map((item: any) => {
          const geo = geographicMap[item.id as keyof typeof geographicMap];
          if (!geo) return null;
          const color = playerColor(item.owner_id, Math.max(0, players.indexOf(item.owner_id)));
          const valid = source && source.owner_id === myPlayerId && source.troops > 1 && source.neighbors.includes(item.id) && ((phase === 'attack' && item.owner_id !== myPlayerId) || (phase === 'movement' && item.owner_id === myPlayerId));
          return <g key={item.id} role="button" tabIndex={0} aria-label={`${item.name}, ${matchState.players[item.owner_id]?.name ?? 'Neutro'}, ${item.troops} tropas`} onClick={() => { if (!dragMoved.current) onNodeClick(item.id); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(item.id); } }} className={`world-cell geo-cell ${selectedNode === item.id ? 'selected' : ''} ${targetNode === item.id || valid ? 'valid' : ''}`}>
            {geo.paths.map((path, i) => <path key={i} d={path.d} transform={'transform' in path ? path.transform : undefined} fill={color} />)}
            <title>{item.name}</title>
          </g>;
        }) : Object.values(matchState.territories).map((item: any) => {
          const x = 12 + item.x * 118, y = 12 + item.y * 126;
          const color = playerColor(item.owner_id, Math.max(0, players.indexOf(item.owner_id)));
          const valid = source && source.owner_id === myPlayerId && source.troops > 1 && source.neighbors.includes(item.id) && ((phase === 'attack' && item.owner_id !== myPlayerId) || (phase === 'movement' && item.owner_id === myPlayerId));
          return <g key={item.id} role="button" tabIndex={0} aria-label={`${item.name}, ${matchState.players[item.owner_id]?.name ?? 'Neutro'}, ${item.troops} tropas`} onClick={() => { if (!dragMoved.current) onNodeClick(item.id); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(item.id); } }} className={`world-cell ${selectedNode === item.id ? 'selected' : ''} ${targetNode === item.id || valid ? 'valid' : ''}`} transform={`translate(${x} ${y})`}>
            <rect width="112" height="120" rx="9" fill={color} />
            <text x="56" y="36" textAnchor="middle" className="world-cell-name">{item.name.split(' ').map((word: string, i: number) => <tspan key={i} x="56" dy={i ? 14 : 0}>{word}</tspan>)}</text>
            <circle cx="56" cy="94" r="16" /><text x="56" y="99" textAnchor="middle" className="world-cell-troops">{item.troops}</text>
          </g>;
        })}
        {matchState.map_id === 'atlas_world_v2' && <g className="geo-markers">{Object.values(matchState.territories).map((item: any) => {
          const geo = geographicMap[item.id as keyof typeof geographicMap];
          if (!geo) return null;
          const color = playerColor(item.owner_id, Math.max(0, players.indexOf(item.owner_id)));
          const valid = source && source.owner_id === myPlayerId && source.troops > 1 && source.neighbors.includes(item.id) && ((phase === 'attack' && item.owner_id !== myPlayerId) || (phase === 'movement' && item.owner_id === myPlayerId));
          const flagCode = TERRITORY_FLAGS[item.id] ?? 'un';
          return <g key={item.id} role="button" tabIndex={0} aria-label={`${item.name}, ${matchState.players[item.owner_id]?.name ?? 'Neutro'}, ${item.troops} tropas`} onClick={() => { if (!dragMoved.current) onNodeClick(item.id); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(item.id); } }} className={`geo-marker ${selectedNode === item.id ? 'selected' : ''} ${targetNode === item.id || valid ? 'valid' : ''}`}>
            <rect className="geo-flag-border" x={geo.x - 16} y={geo.y - 15} width="32" height="22" rx="2" fill="#090909" stroke={color} strokeWidth="1.5" />
            <text x={geo.x} y={geo.y} textAnchor="middle" className="geo-flag-fallback">{flagCode.toUpperCase()}</text>
            <image className="geo-country-flag" href={`https://flagcdn.com/w80/${flagCode}.png`} x={geo.x - 15} y={geo.y - 14} width="30" height="20" preserveAspectRatio="xMidYMid slice" onError={event => { event.currentTarget.style.display = 'none'; }} />
            <rect className="geo-troop-count-bg" x={geo.x - 9} y={geo.y + 6} width="18" height="13" rx="2" fill="#090909" stroke={color} strokeWidth="1" />
            <text x={geo.x} y={geo.y + 16} textAnchor="middle" className="geo-troops">{item.troops}</text>
          </g>;
        })}</g>}
        {matchState.map_id === 'atlas_world_v2' && <g className="geo-labels" pointerEvents="none">{Object.values(matchState.territories).map((item: any) => {
          const geo = geographicMap[item.id as keyof typeof geographicMap];
          return geo ? <text key={item.id} x={geo.x} y={geo.y + 29} textAnchor="middle" className="geo-name">{item.name}</text> : null;
        })}</g>}
        {battleAnimation && battleSource && battleTarget && <BattleAnimation source={battleSource} target={battleTarget} color={battleAnimation.attackerColor} troopCount={battleAnimation.attacking_troops_sent} animationId={battleAnimation.animationId} />}
      </svg>
      <div className="world-legend">{players.map((id, i) => <span key={id}><i style={{background: playerColor(id, i)}} />{matchState.players[id].name}</span>)}</div>
      </div>
    </div>;
  }

  const territories = matchState.territories;
  const nodes = Object.keys(territories);
  const playerIds = Object.keys(matchState.players ?? {}).sort();


  const getPlayerColor = (playerId: string | null) => {
    if (!playerId) return '#101C29';
    const index = playerIds.indexOf(playerId);
    return playerColor(playerId, index < 0 ? 0 : index);
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

        {battleAnimation && battleSource && battleTarget && <BattleAnimation source={battleSource} target={battleTarget} color={battleAnimation.attackerColor} troopCount={battleAnimation.attacking_troops_sent} animationId={battleAnimation.animationId} />}
      </svg>
    </div>
  );
}
