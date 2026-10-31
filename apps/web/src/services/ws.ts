import { useGameStore } from '../store/useGameStore';

const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.DEV
  ? 'ws://localhost:8000/ws'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
let socket: WebSocket | null = null;
let retry: ReturnType<typeof setTimeout> | null = null;
let stopped = false;

function friendlyReason(reason: string) {
  const messages: Record<string, string> = {
    'Cannot attack your own territory': 'Você já controla esse território.',
    'Cannot attack a neutral territory in MVP': 'Esse território ainda é neutro.',
    'Target territory is not adjacent': 'Escolha um território conectado à sua fronteira.',
    'Source territory does not belong to you': 'A origem precisa ser um território seu.',
    'Target territory does not belong to you': 'O destino precisa ser um território seu.',
    'It is not your turn': 'Aguarde o seu turno para agir.',
    'End turn is not allowed before attack or movement phase': 'Avance até a fase de ataque ou movimentação.',
  };
  return messages[reason] ?? reason;
}

export function connectWebSocket(roomCode: string, token: string) {
  stopped = false;
  if (socket) { socket.onclose = null; socket.close(); }

  socket = new WebSocket(`${WS_URL}/rooms/${roomCode}?token=${encodeURIComponent(token)}`);

  socket.onopen = () => {
    console.log('Atlas War connected');
    useGameStore.getState().setConnectionStatus(true);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Intercepted transmission:', data);
      
      if (data.event === 'match_state_updated' && data.state) {
        useGameStore.getState().setMatchState(data.state);
      } else if (data.event === 'action_rejected') {
        useGameStore.getState().setError(`Ação recusada: ${friendlyReason(data.reason)}`);
      }
    } catch (e) {
      console.error('Failed to parse transmission', e);
    }
  };

  socket.onclose = () => {
    console.log('Atlas War disconnected');
    useGameStore.getState().setConnectionStatus(false);
    if (!stopped) retry = setTimeout(() => connectWebSocket(roomCode, token), 2000);
  };
}

export function sendAction(type: string, payload: any = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  } else {
    useGameStore.getState().setError('Conexão offline. Não foi possível enviar a ação.');
  }
}

export function disconnectWebSocket() {
  stopped = true;
  if (retry) clearTimeout(retry);
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}
