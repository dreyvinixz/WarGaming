import { Flag, HelpCircle, LogOut, Plane, Shield } from 'lucide-react';
import './TopStatusBar.css';

interface TopStatusBarProps {
  roomCode: string;
  roundNumber: number;
  isMyTurn: boolean;
  currentPlayerName: string;
  reinforcementPool: number;
  fighters: number;
  onOpenTutorial: () => void;
  onExitMatch?: () => void;
}

export function TopStatusBar({
  roomCode,
  roundNumber,
  isMyTurn,
  currentPlayerName,
  reinforcementPool,
  fighters,
  onOpenTutorial,
  onExitMatch,
}: TopStatusBarProps) {
  return (
    <header className="top-status-bar" role="banner">
      <div className="top-bar-left">
        <div className="top-bar-brand">
          <span className="top-bar-brand-icon"><Shield size={16} /></span>
          <strong>ATLAS <b>WAR</b></strong>
        </div>
        <div className="top-bar-divider" />
        <div className="top-bar-meta-item">
          <span className="top-bar-meta-label">SECTOR:</span>
          <span className="top-bar-meta-value">{roomCode}</span>
        </div>
        <div className="top-bar-meta-item hide-mobile">
          <span className="section-kicker">RODADA {roundNumber}</span>
        </div>
      </div>

      <div className="top-bar-center">
        <div className={`turn-indicator-badge ${isMyTurn ? 'is-my-turn' : 'is-waiting'}`}>
          <span className="turn-dot" />
          <span>{isMyTurn ? 'SEU TURNO' : `TURNO DE ${currentPlayerName.toUpperCase()}`}</span>
        </div>
      </div>

      <div className="top-bar-right">
        <div className={`reserves-counter-badge ${reinforcementPool > 0 ? 'has-reserves' : ''}`}>
          <span className="reserves-icon"><Flag size={14} /></span>
          <span className="top-bar-meta-label hide-mobile">REFORÇOS:</span>
          <span className="reserves-count">{String(reinforcementPool).padStart(2, '0')}</span>
        </div>
        <div className={`fighter-counter-badge ${fighters > 0 ? 'has-fighters' : ''}`} title="Caças de apoio disponíveis">
          <Plane size={14} />
          <span className="hide-mobile">CAÇAS:</span>
          <strong>{String(fighters).padStart(2, '0')}</strong>
        </div>

        <button className="top-bar-btn" onClick={onOpenTutorial} title="Como jogar">
          <HelpCircle size={15} />
          <span className="hide-mobile">AJUDA</span>
        </button>

        {onExitMatch && (
          <button className="top-bar-btn" onClick={onExitMatch} title="Sair da partida" aria-label="Sair da partida">
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
