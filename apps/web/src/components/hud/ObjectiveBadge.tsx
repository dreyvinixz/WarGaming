import { useState } from 'react';
import { Target } from 'lucide-react';
import './ObjectiveBadge.css';

interface ObjectiveBadgeProps {
  controlledCount: number;
  troopCount: number;
  totalTerritories?: number;
  objective?: { title: string; description: string };
}

export function ObjectiveBadge({
  controlledCount,
  troopCount,
  totalTerritories = 13,
  objective,
}: ObjectiveBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const percent = Math.min(100, Math.round((controlledCount / totalTerritories) * 100));

  return (
    <div className="objective-badge-container">
      {isOpen && (
        <div className="objective-card-popover" role="region" aria-label="Objetivo da Missão">
          <div className="objective-popover-header">
            <Target size={14} />
            <span>SUA MISSÃO SECRETA</span>
          </div>
          <div className="objective-popover-title">{objective?.title ?? "Objetivo indisponível"}</div>
          <div className="objective-popover-desc">
            {objective?.description ?? "Reconecte para recuperar seu objetivo."}
          </div>
          <div className="objective-progress-bar">
            <div className="objective-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="objective-stats-row">
            <span>TERRITÓRIOS: <strong>{controlledCount} / {totalTerritories}</strong></span>
            <span>FORÇAS: <strong>{troopCount}</strong></span>
          </div>
        </div>
      )}

      <button
        className="objective-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="objective-trigger-dot" />
        <span>VER MINHA MISSÃO</span>
      </button>
    </div>
  );
}
