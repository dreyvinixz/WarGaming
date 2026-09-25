import { useState } from 'react';
import { ArrowRight, Crosshair, Map, Play, Shield, Sparkles, Users } from 'lucide-react';
import { createRoom, joinRoom, startMatch } from '../services/api';
import { useGameStore } from '../store/useGameStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './Lobby.css';

export function Lobby() {
  const [name, setName] = useState('');
  const [roomToJoin, setRoomToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPlayerInfo, roomCode, playerToken, isConnected } = useGameStore();

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
    try { await joinRoom(roomToJoin.trim().toUpperCase(), name.trim()); setPlayerInfo(name.trim(), roomToJoin.trim().toUpperCase()); }
    catch (e: any) { setError(e.message || 'Não foi possível entrar nessa sala.'); }
    finally { setLoading(false); }
  };

  const handleStartMatch = async () => {
    setLoading(true); setError('');
    try { await startMatch(roomCode, playerToken); }
    catch (e: any) { setError(e.message || 'Não foi possível iniciar a partida.'); }
    finally { setLoading(false); }
  };

  if (roomCode) return <div className="lobby-screen waiting-screen"><header className="lobby-nav"><div className="lobby-brand"><span><Shield size={19} /></span> ATLAS <b>WAR</b></div><span className="lobby-nav-note">SALA DE ESPERA</span></header><main className="waiting-layout"><div className="waiting-copy"><span className="section-kicker">A FRONTEIRA ESTÁ PRONTA</span><h1>Sala <em>{roomCode}</em></h1><p>Convide outro jogador para iniciar a disputa pelo mapa.</p><div className="room-code-display"><small>CÓDIGO DA SALA</small><strong>{roomCode}</strong><span>Compartilhe este código com quem vai jogar.</span></div></div><section className="waiting-card panel-card"><div className="waiting-card-heading"><div className="waiting-pulse"><i /><i /><i /></div><div><span className="section-kicker">PONTO DE ENCONTRO</span><h2>Jogadores</h2></div></div><div className="player-slot is-host"><span className="player-avatar"><Shield size={17} /></span><div><strong>{name}</strong><small>anfitrião · você</small></div><span className="ready-badge">PRONTO</span></div><div className="player-slot"><span className="player-avatar muted"><Users size={17} /></span><div><strong>Aguardando adversário</strong><small>envie o código da sala</small></div><span className="waiting-badge">...</span></div>{error && <div className="error-banner">{error}</div>}{playerToken ? <Button onClick={handleStartMatch} isLoading={loading} className="lobby-primary"><Play size={17} /> Iniciar partida</Button> : <p className="waiting-note">Aguardando o anfitrião iniciar...</p>}<div className="connection-line"><i className={isConnected ? 'online' : ''} /> {isConnected ? 'Conexão estabelecida' : 'Conectando ao servidor'}</div></section></main></div>;

  return <div className="lobby-screen"><header className="lobby-nav"><div className="lobby-brand"><span><Shield size={19} /></span> ATLAS <b>WAR</b></div><div className="lobby-nav-links"><span><i /> servidor online</span><button>Como funciona <ArrowRight size={14} /></button></div></header><main className="lobby-main"><section className="lobby-hero"><div className="hero-copy"><span className="section-kicker"><Sparkles size={13} /> ESTRATÉGIA · TERRITÓRIO · DOMÍNIO</span><h1>O mundo é grande.<br /><em>Seu próximo movimento também.</em></h1><p>Entre no Atlas War, escolha sua fronteira e escreva a história da partida em um mapa vivo.</p><div className="hero-stats"><div><strong>13</strong><span>territórios<br />estratégicos</span></div><div><strong>4</strong><span>jogadores<br />por partida</span></div><div><strong>3</strong><span>fases<br />por turno</span></div></div></div><div className="hero-map-art"><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-world"><Map size={70} /><span>ATLAS<br /><b>VIVO</b></span></div><div className="hero-pin pin-a"><Crosshair size={14} /> EUROPA</div><div className="hero-pin pin-b"><Crosshair size={14} /> AMÉRICA DO SUL</div></div></section><section className="lobby-entry panel-card"><div className="entry-heading"><div><span className="section-kicker">COMECE SUA CAMPANHA</span><h2>Como você quer jogar?</h2></div><span className="entry-step">01 <i /> 02</span></div><div className="entry-form"><Input label="Seu nome de jogador" placeholder="Ex.: Comandante Lia" value={name} onChange={event => setName(event.target.value)} maxLength={20} /><Button onClick={handleCreateRoom} isLoading={loading} className="lobby-primary"><Shield size={17} /> Criar nova partida <ArrowRight size={16} /></Button></div><div className="entry-divider"><span>ou entre em uma partida existente</span></div><div className="join-form"><Input label="Código da sala" placeholder="Ex.: A7C9T2" value={roomToJoin} onChange={event => setRoomToJoin(event.target.value.toUpperCase())} maxLength={6} /><Button onClick={handleJoinRoom} variant="secondary" isLoading={loading}><Users size={17} /> Entrar na sala</Button></div>{error && <div className="error-banner">{error}</div>}</section><section className="lobby-how"><div className="how-heading"><span className="section-kicker">SEU PRIMEIRO TURNO</span><h2>Três decisões para começar</h2></div><div className="how-grid"><article><span>01</span><Map size={19} /><strong>Leia o mapa</strong><p>As cores mostram quem controla cada território.</p></article><article><span>02</span><Crosshair size={19} /><strong>Escolha uma fronteira</strong><p>Reforce, ataque ou mova tropas com propósito.</p></article><article><span>03</span><Shield size={19} /><strong>Conquiste espaço</strong><p>Controle regiões e cumpra seu objetivo.</p></article></div></section></main></div>;
}
