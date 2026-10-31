import { useEffect } from 'react';
import { Lobby } from './pages/Lobby';
import { MatchBoard } from './pages/MatchBoard';
import { useGameStore } from './store/useGameStore';
import { connectWebSocket, disconnectWebSocket } from './services/ws';

function App() {
  const { matchState, roomCode, playerToken } = useGameStore();

  useEffect(() => {
    if (roomCode && playerToken) {
      connectWebSocket(roomCode, playerToken);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [roomCode, playerToken]);

  return (
    <>
      {!matchState ? <Lobby /> : <MatchBoard />}
    </>
  );
}

export default App;
