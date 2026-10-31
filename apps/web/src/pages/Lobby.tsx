import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Play, Shield, Users, Settings, X } from 'lucide-react';
import { createRoom, joinRoom, startMatch, getRoom, leaveWaitingRoom } from '../services/api';
import { useGameStore } from '../store/useGameStore';
import { disconnectWebSocket } from '../services/ws';
import { getGameAudioSettings, updateGameAudioSettings, type GameAudioSettings } from '../services/gameAudio';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './Lobby.css';

export function Lobby() {
  const [name, setName] = useState('');
  const [playerColor, setPlayerColor] = useState('#CF3630');
  const [customColorChosen, setCustomColorChosen] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioSettings, setAudioSettings] = useState(getGameAudioSettings);
  const [reducedMotion, setReducedMotion] = useState(() => {
    const preference = localStorage.getItem('atlas-reduced-motion');
    return preference === 'true' || (preference === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  });
  useEffect(() => { document.documentElement.classList.toggle('reduce-game-motion', reducedMotion); localStorage.setItem('atlas-reduced-motion', String(reducedMotion)); }, [reducedMotion]);
  const [roomToJoin, setRoomToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPlayerInfo, roomCode, playerToken, isConnected, reset, savedSession, resume } = useGameStore();

  const [room, setRoom] = useState<any>(null);
  const changeAudioSetting = (key: keyof GameAudioSettings, value: number) => {
    setAudioSettings(updateGameAudioSettings({ [key]: value }));
  };
  useEffect(() => {
    if (!roomCode) return;
    const refresh = () => getRoom(roomCode).then(setRoom).catch((error: Error) => {
      if (error.message === 'Sala indisponível') {
        disconnectWebSocket();
        reset();
        return;
      }
      setError('Não foi possível acessar esta sala. Verifique sua conexão e tente novamente.');
    });
    refresh(); const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [roomCode]);
  const handleCreateRoom = async () => {
    if (name.trim().length < 2) return setError('Digite pelo menos 2 caracteres para o seu nome.');
    setLoading(true); setError('');
    try { const data = await createRoom(name.trim(), playerColor); setPlayerInfo(name.trim(), data.room_code, data.player_token); }
    catch (e: any) { setError(e.message || 'Não foi possível criar a sala.'); }
    finally { setLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (name.trim().length < 2 || roomToJoin.trim().length < 4) return setError('Informe seu nome e o código da sala.');
    setLoading(true); setError('');
    try { const data = await joinRoom(roomToJoin.trim().toUpperCase(), name.trim(), playerColor); setPlayerInfo(name.trim(), data.room_code, data.player_token); }
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

  if (roomCode) {
    const localArmyColor = room?.players?.find((p: any) => p.name === useGameStore.getState().playerName)?.color ?? playerColor;
    const rgb = /^#[\da-f]{6}$/i.test(localArmyColor)
      ? [1, 3, 5].map(offset => parseInt(localArmyColor.slice(offset, offset + 2), 16))
      : null;
    const armyInk = rgb && (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150 ? '#090909' : '#FFFFFF';
    const waitingTheme = { '--army-color': localArmyColor, '--army-ink': armyInk } as CSSProperties;
    return <div className="lobby-screen waiting-screen" style={waitingTheme}>
      <header className="lobby-nav"><div className="lobby-brand"><svg className="lobby-brand-crest" viewBox="0 0 96 108" aria-hidden="true"><path d="M8 8h80v51c0 21-17 34-40 44C25 93 8 80 8 59V8Z" fill="#131314" stroke="#EDEBE7" strokeWidth="2.5"/><path d="M14 14h68v44c0 17-13 28-34 38-21-10-34-21-34-38V14Z" stroke="#77777B" strokeWidth="1.3"/><path d="m48 25 4.8 15.2L69 45l-16.2 4.8L48 66l-4.8-16.2L27 45l16.2-4.8L48 25Z" fill="var(--army-color)"/><circle cx="48" cy="45" r="5" fill="#131314" stroke="#A5A29F" strokeWidth="1.5"/><path d="M19 66c7 0 11 4 13 10-6 0-10-2-13-10Zm58 0c-7 0-11 4-13 10 6 0 10-2 13-10Z" stroke="#A5A29F" strokeWidth="2" strokeLinecap="round"/><path d="M31 78h34M36 84h24" stroke="#EDEBE7" strokeWidth="1.5" strokeLinecap="round"/></svg> ATLAS <b>WAR</b></div><span className="lobby-nav-note">SALA DE ESPERA</span></header>
      <main className="waiting-layout">
        <div className="waiting-copy"><span className="section-kicker">A FRONTEIRA ESTÁ PRONTA</span><h1>Sala <em>{roomCode}</em></h1><p>Convide outro jogador para iniciar a disputa pelo mapa.</p><div className="room-code-display"><small>CÓDIGO DA SALA</small><strong>{roomCode}</strong><span>Compartilhe este código com quem vai jogar.</span></div><img className="waiting-figure" src="/assets/campaign/army-standard.png" alt="" aria-hidden="true" /></div>
        <section className="waiting-card panel-card"><div className="waiting-card-heading"><div className="waiting-pulse"><i /><i /><i /></div><div><span className="section-kicker">PONTO DE ENCONTRO</span><h2>Jogadores</h2></div></div>
          {room?.players?.map((p: any) => <div className={`player-slot ${p.name === useGameStore.getState().playerName ? 'is-self' : ''}`} key={p.id}><span className="player-avatar" style={{ backgroundColor: p.color ?? '#49A3D9' }}><b>{p.name.slice(0, 1).toUpperCase()}</b></span><div><strong>{p.name}</strong><small>{p.is_host ? 'anfitrião' : 'jogador'}{p.name === useGameStore.getState().playerName ? ' · você' : ''}</small></div><span className="player-color-chip" style={{ backgroundColor: p.color ?? '#49A3D9' }} aria-label={`Cor ${p.color ?? '#49A3D9'}`} /></div>)}
          {error && <div className="error-banner">{error}</div>}
          {room?.players?.some((p: any) => p.is_host && p.name === useGameStore.getState().playerName) ? <><Button onClick={handleStartMatch} isLoading={loading} disabled={!isConnected || room.players.length < 2} className="lobby-primary"><Play size={17} /> Iniciar partida</Button>{room.players.length < 2 && <p className="waiting-note">Aguardando pelo menos dois jogadores.</p>}</> : <p className="waiting-note">Aguardando o anfitrião iniciar...</p>}
          <Button variant="secondary" onClick={handleLeaveRoom} isLoading={loading}>Sair da sala</Button>{error && <button className="waiting-note" onClick={() => { disconnectWebSocket(); reset(); }}>Voltar ao início sem sair no servidor</button>}<div className="connection-line"><i className={isConnected ? 'online' : ''} /> {isConnected ? 'Conexão estabelecida' : 'Conectando ao servidor'}</div>
        </section>
      </main>
    </div>;
  }

  return (
    <div className="game-menu">
      <section className="game-menu__world" aria-label="Atlas War">
        <div className="game-menu__art" aria-hidden="true">
          <img className="game-menu__image" src="/assets/campaign/campaign-war.webp" alt="" />
          <video className="game-menu__video" autoPlay loop muted playsInline preload="auto" poster="/assets/campaign/campaign-war.webp" tabIndex={-1} onError={event => { event.currentTarget.hidden = true; }}>
            <source src="/assets/campaign/campaign-loop.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="game-menu__brand"><img src="/assets/ui/atlas-crest.svg" alt="" /><span>ATLAS <b>WAR</b><small>ESTRATÉGIA TERRITORIAL</small></span></div>
        <div className="game-menu__heading"><span>36 TERRITÓRIOS · 6 REGIÕES</span><h1>O mapa<br /><em>está em jogo.</em></h1><p>Reúna seus aliados. Escolha suas fronteiras. Conquiste o mundo.</p></div>
        <footer className="game-menu__world-footer"><span>UMA GUERRA DE ESTRATÉGIA E CONQUISTA</span><img src="/assets/ui/ornate-divider.svg" alt="" /></footer>
      </section>
      <main className="game-menu__stage">
        <button className="menu-settings" onClick={() => setSettingsOpen(true)} aria-label="Configurações"><Settings size={20} /></button>
        <section className="game-menu__panel" aria-label="Menu de partida">
          <div className="game-menu__panel-heading"><span className="section-kicker">CENTRO DE COMANDO</span><h2>{mode === 'create' ? 'Prepare sua campanha' : 'Entre na batalha'}</h2><p>{mode === 'create' ? 'Crie uma sala e chame outros comandantes.' : 'Informe o código da sala para se juntar à partida.'}</p></div>
          <div className="menu-mode-tabs" role="group" aria-label="Modo de entrada"><button className={mode === 'create' ? 'active' : ''} onClick={() => {setMode('create'); if (!customColorChosen) setPlayerColor('#CF3630'); setError('');}}><Shield size={20}/> Criar sala</button><button className={mode === 'join' ? 'active' : ''} onClick={() => {setMode('join'); if (!customColorChosen) setPlayerColor('#49A3D9'); setError('');}}><Users size={20}/> Entrar em sala</button></div>
          {savedSession && <div className="resume-session"><span>Partida guardada: <strong>{savedSession.room}</strong></span><button type="button" onClick={resume}>Retomar partida</button></div>}
          <Input label="Nome do comandante" placeholder="Ex.: Comandante Lia" value={name} onChange={event => setName(event.target.value)} maxLength={20}/>
          {mode === 'join' && <Input label="Código da sala" placeholder="Ex.: A7C9T2" value={roomToJoin} onChange={event => setRoomToJoin(event.target.value.toUpperCase())} maxLength={6}/>}
          <label className="commander-color-picker"><span>Cor do exército</span><input type="color" value={playerColor} onChange={event => { setPlayerColor(event.target.value.toUpperCase()); setCustomColorChosen(true); }} /><strong>{playerColor}</strong></label>
          {error && <div className="error-banner" role="alert">{error}</div>}
          {mode === 'create' ? <Button onClick={handleCreateRoom} isLoading={loading} className="menu-play"><span>CRIAR PARTIDA</span><ArrowRight size={21}/></Button> : <Button onClick={handleJoinRoom} isLoading={loading} className="menu-play"><span>ENTRAR NA SALA</span><ArrowRight size={21}/></Button>}
          <p className="menu-panel-note">PARTIDA PRIVADA · ATÉ 6 COMANDANTES</p>
        </section>
        <footer className="game-menu__stage-footer">ATLAS WAR <span>·</span> JOGO DE ESTRATÉGIA</footer>
      </main>
      {settingsOpen && <div className="menu-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="menu-modal"><button className="menu-modal-close" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações"><X size={18}/></button><h2 id="settings-title">Configurações</h2><label><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)}/> Reduzir animações</label><div className="audio-settings" aria-label="Volumes de áudio">{([['master', 'Volume geral'], ['music', 'Música'], ['effects', 'Efeitos sonoros']] as const).map(([key, label]) => <label className="audio-settings-control" key={key}><span>{label}<output>{audioSettings[key]}%</output></span><input type="range" min="0" max="100" step="1" value={audioSettings[key]} onChange={event => changeAudioSetting(key, Number(event.target.value))} aria-label={label} /></label>)}</div><p>As preferências de áudio são salvas neste navegador.</p><button onClick={() => setSettingsOpen(false)}>Concluído</button></section></div>}
    </div>
  );
}
