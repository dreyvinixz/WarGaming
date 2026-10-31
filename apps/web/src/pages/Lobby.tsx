import { useState, useEffect } from 'react';
import { ArrowRight, Globe2, Play, Shield, Users, Settings, X } from 'lucide-react';
import { createRoom, joinRoom, startMatch, getRoom, leaveWaitingRoom } from '../services/api';
import { useGameStore } from '../store/useGameStore';
import { disconnectWebSocket } from '../services/ws';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './Lobby.css';

export function Lobby() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('atlas-reduced-motion') === 'true');
  useEffect(() => { document.documentElement.classList.toggle('reduce-game-motion', reducedMotion); localStorage.setItem('atlas-reduced-motion', String(reducedMotion)); }, [reducedMotion]);
  const [roomToJoin, setRoomToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPlayerInfo, roomCode, playerToken, isConnected, reset, savedSession, resume } = useGameStore();

  const [room, setRoom] = useState<any>(null);
  useEffect(() => {
    if (!roomCode) return;
    const refresh = () => getRoom(roomCode).then(setRoom).catch(() => setError('Não foi possível encontrar ou acessar esta sala. Você pode voltar ao início.'));
    refresh(); const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [roomCode]);
  const handleCreateRoom = async () => {
    if (name.trim().length < 2) return setError('Digite pelo menos 2 caracteres para o seu nome.');
    setLoading(true); setError('');
    try { const data = await createRoom(name.trim()); setPlayerInfo(name.trim(), data.room_code, data.player_token); }
    catch (e: any) { setError(e.message || 'Não foi possível criar a sala.'); }
    finally { setLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (name.trim().length < 2 || roomToJoin.trim().length < 4) return setError('Informe seu nome e o código da sala.');
    setLoading(true); setError('');
    try { const data = await joinRoom(roomToJoin.trim().toUpperCase(), name.trim()); setPlayerInfo(name.trim(), data.room_code, data.player_token); }
    catch (e: any) { setError(e.message || 'Não foi possível entrar nessa sala.'); }
    finally { setLoading(false); }
  };

  const handleLeaveRoom = async () => {
    setLoading(true); setError('');
    try { await leaveWaitingRoom(roomCode, playerToken); disconnectWebSocket(); reset(); }
    catch (e: any) { setError(e.message || 'Não foi possível sair da sala.'); }
    finally { setLoading(false); }
  };

  const handleStartMatch = async () => {
    setLoading(true); setError('');
    try { await startMatch(roomCode, playerToken); }
    catch (e: any) { setError(e.message || 'Não foi possível iniciar a partida.'); }
    finally { setLoading(false); }
  };

  if (roomCode) return <div className="lobby-screen waiting-screen"><header className="lobby-nav"><div className="lobby-brand"><span><Shield size={19} /></span> ATLAS <b>WAR</b></div><span className="lobby-nav-note">SALA DE ESPERA</span></header><main className="waiting-layout"><div className="waiting-copy"><span className="section-kicker">A FRONTEIRA ESTÁ PRONTA</span><h1>Sala <em>{roomCode}</em></h1><p>Convide outro jogador para iniciar a disputa pelo mapa.</p><div className="room-code-display"><small>CÓDIGO DA SALA</small><strong>{roomCode}</strong><span>Compartilhe este código com quem vai jogar.</span></div><img className="waiting-figure" src="/army-standard.png" alt="" aria-hidden="true" /></div><section className="waiting-card panel-card"><div className="waiting-card-heading"><div className="waiting-pulse"><i /><i /><i /></div><div><span className="section-kicker">PONTO DE ENCONTRO</span><h2>Jogadores</h2></div></div>{room?.players?.map((p: any) => <div className="player-slot" key={p.id}><span className="player-avatar"><Shield size={17} /></span><div><strong>{p.name}</strong><small>{p.is_host ? 'anfitrião' : 'jogador'}{p.name === useGameStore.getState().playerName ? ' · você' : ''}</small></div></div>)}{error && <div className="error-banner">{error}</div>}{room?.players?.some((p: any) => p.is_host && p.name === useGameStore.getState().playerName) ? <><Button onClick={handleStartMatch} isLoading={loading} disabled={!isConnected || room.players.length < 2} className="lobby-primary"><Play size={17} /> Iniciar partida</Button>{room.players.length < 2 && <p className="waiting-note">Aguardando pelo menos dois jogadores.</p>}</> : <p className="waiting-note">Aguardando o anfitrião iniciar...</p>}<Button variant="secondary" onClick={handleLeaveRoom} isLoading={loading}>Sair da sala</Button>{error && <button className="waiting-note" onClick={() => { disconnectWebSocket(); reset(); }}>Voltar ao início sem sair no servidor</button>}<div className="connection-line"><i className={isConnected ? 'online' : ''} /> {isConnected ? 'Conexão estabelecida' : 'Conectando ao servidor'}</div></section></main></div>;

  return (
    <div className="game-menu">
      <div className="game-menu__art" aria-hidden="true" />
      <header className="game-menu__header"><div className="game-menu__brand"><Globe2 size={23} /><span>ATLAS <b>WAR</b><small>ESTRATÉGIA TERRITORIAL</small></span></div><button className="menu-settings" onClick={() => setSettingsOpen(true)} aria-label="Configurações"><Settings size={19} /></button></header>
      <main className="game-menu__main">
        <div className="game-menu__heading"><span>UMA PARTIDA DE ESTRATÉGIA</span><h1>O MUNDO<br /><em>ESTÁ EM JOGO.</em></h1><p>Escolha sua próxima jogada.</p></div>
        <section className="game-menu__panel" aria-label="Menu de partida">
          <div className="menu-mode-tabs" role="group" aria-label="Modo de entrada"><button className={mode === 'create' ? 'active' : ''} onClick={() => {setMode('create'); setError('');}}><Shield size={17}/> Criar sala</button><button className={mode === 'join' ? 'active' : ''} onClick={() => {setMode('join'); setError('');}}><Users size={17}/> Entrar em sala</button></div>
          {savedSession && <div className="resume-session"><span>Partida guardada: <strong>{savedSession.room}</strong></span><button type="button" onClick={resume}>Retomar partida</button></div>}
          <Input label="Seu nome" placeholder="Ex.: Comandante Lia" value={name} onChange={event => setName(event.target.value)} maxLength={20}/>
          {mode === 'join' && <Input label="Código da sala" placeholder="Ex.: A7C9T2" value={roomToJoin} onChange={event => setRoomToJoin(event.target.value.toUpperCase())} maxLength={6}/>}
          {error && <div className="error-banner" role="alert">{error}</div>}
          {mode === 'create' ? <Button onClick={handleCreateRoom} isLoading={loading} className="menu-play"><span>CRIAR PARTIDA</span><ArrowRight size={18}/></Button> : <Button onClick={handleJoinRoom} isLoading={loading} className="menu-play"><span>ENTRAR NA SALA</span><ArrowRight size={18}/></Button>}
          <p className="menu-panel-note">{mode === 'create' ? 'Crie uma sala e convide outro comandante.' : 'Use o código compartilhado pelo anfitrião.'}</p>
        </section>
      </main>
      <footer className="game-menu__footer"><span>ATLAS WAR · JOGO DE ESTRATÉGIA</span><span>PARTIDA PRIVADA POR CÓDIGO</span></footer>
      {settingsOpen && <div className="menu-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="menu-modal"><button className="menu-modal-close" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações"><X size={18}/></button><h2 id="settings-title">Configurações</h2><label><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)}/> Reduzir animações</label><p>A preferência é salva neste navegador.</p><button onClick={() => setSettingsOpen(false)}>Concluído</button></section></div>}
    </div>
  );
}
