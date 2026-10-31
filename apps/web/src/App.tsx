import { useEffect } from 'react';
import { Lobby } from './pages/Lobby';
import { MatchBoard } from './pages/MatchBoard';
import { useGameStore } from './store/useGameStore';
import { connectWebSocket, disconnectWebSocket } from './services/ws';
import { setGameAudioScene, unlockGameAudio } from './services/gameAudio';

function App() {
  const { matchState, roomCode, playerToken } = useGameStore();
  const audioScene = matchState ? 'match' : roomCode ? 'waiting' : 'menu';

  useEffect(() => {
    if (roomCode && playerToken) {
      connectWebSocket(roomCode, playerToken);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [roomCode, playerToken]);

  useEffect(() => {
    setGameAudioScene(audioScene);
  }, [audioScene]);

  useEffect(() => {
    const unlock = () => {
      unlockGameAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <>
      {!matchState ? <Lobby /> : <MatchBoard />}
    </>
  );
}

export default App;
