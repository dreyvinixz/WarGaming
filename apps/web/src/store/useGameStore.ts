import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedSession { name: string; room: string; token: string }

interface GameState {
  savedSession: SavedSession | null;
  saveAndExit: () => void;
  resume: () => void;
  playerName: string;
  roomCode: string;
  playerToken: string;
  isConnected: boolean;
  matchState: any | null;
  error: string;
  setError: (error: string) => void;
  setPlayerInfo: (name: string, room: string, token?: string) => void;
  setConnectionStatus: (status: boolean) => void;
  setMatchState: (state: any) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>()(persist((set) => ({
  savedSession: null,
  saveAndExit: () => set((state) => ({ savedSession: { name: state.playerName, room: state.roomCode, token: state.playerToken }, playerName: '', roomCode: '', playerToken: '', isConnected: false, matchState: null, error: '' })),
  resume: () => set((state) => state.savedSession ? { playerName: state.savedSession.name, roomCode: state.savedSession.room, playerToken: state.savedSession.token, savedSession: null } : {}),
  playerName: '',
  roomCode: '',
  playerToken: '',
  isConnected: false,
  matchState: null,
  error: '',
  setError: (error) => set({ error }),

  setPlayerInfo: (name, room, token = '') => 
    set((state) => ({ 
      playerName: name, 
      roomCode: room, 
      playerToken: token || state.playerToken 
    })),
    
  setConnectionStatus: (status) => set({ isConnected: status }),
  
  setMatchState: (state) => set({ matchState: state }),
  
  reset: () => set({ 
    playerName: '', 
    roomCode: '', 
    playerToken: '', 
    isConnected: false, 
    matchState: null,
    error: ''
  })
}), { name: 'atlas-session', partialize: (state) => ({ playerName: state.playerName, roomCode: state.roomCode, playerToken: state.playerToken, savedSession: state.savedSession }) }));
