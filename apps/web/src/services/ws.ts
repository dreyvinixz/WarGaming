import { useGameStore } from '../store/useGameStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
let socket: WebSocket | null = null;

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

export function connectWebSocket(roomCode: string, playerName: string) {
  if (socket) {
    socket.close();
  }

  socket = new WebSocket(`${WS_URL}/rooms/${roomCode}?player_name=${encodeURIComponent(playerName)}`);

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
        alert(`Ação recusada: ${friendlyReason(data.reason)}`);
      }
    } catch (e) {
      console.error('Failed to parse transmission', e);
    }
  };

  socket.onclose = () => {
    console.log('Atlas War disconnected');
    useGameStore.getState().setConnectionStatus(false);
  };
}

export function sendAction(type: string, payload: any = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  } else {
    console.warn('Conexão offline. Não foi possível enviar a ação.');
  }
}

export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
