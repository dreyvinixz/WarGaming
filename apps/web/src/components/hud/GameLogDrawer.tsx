import { useEffect } from 'react';
import { Bell, CheckCircle2, ChevronUp, Flag, Swords, Users, X } from 'lucide-react';
import './GameLogDrawer.css';

interface GameLogDrawerProps {
  open: boolean;
  onClose: () => void;
  logs: any[];
}

const logLabels: Record<string, string> = {
  match_started: 'Partida iniciada',
  turn_started: 'Novo turno',
  turn_ended: 'Turno encerrado',
  phase_changed: 'Fase avançada',
  reinforcement: 'Reforço enviado',
  reinforcement_timeout: 'Reforços expirados',
  attack_success: 'Território conquistado',
  attack_failed: 'Ataque repelido',
  troop_movement: 'Tropas movidas',
  player_eliminated: 'Jogador eliminado',
  match_finished: 'Partida encerrada',
};

const phaseLabels: Record<string, string> = {
  reinforcement: 'Reforço',
  attack: 'Ataque',
  movement: 'Movimentação',
};

function FeedIcon({ type }: { type: string }) {
  if (type.includes('attack') || type === 'player_eliminated') return <Swords size={14} />;
  if (type.includes('reinforcement') || type === 'troop_movement') return <Flag size={14} />;
  if (type.includes('turn')) return <Users size={14} />;
  if (type === 'match_finished') return <CheckCircle2 size={14} />;
  return <Bell size={14} />;
}

function friendlyMessage(log: any) {
  const territory = log.payload?.territory_id ?? 'território';
  if (log.type === 'match_started') return 'A partida começou. O mapa está aberto para disputa.';
  if (log.type === 'turn_started') return `Rodada ${log.payload?.round ?? ''} iniciada com ${log.payload?.reinforcement_pool ?? 0} reforços.`;
  if (log.type === 'turn_ended') return 'O turno foi encerrado e o mapa avançou.';
  if (log.type === 'phase_changed') return `A fase mudou para ${phaseLabels[log.payload?.phase] ?? 'a próxima etapa'}.`;
  if (log.type === 'reinforcement') return `Reforços enviados para ${territory}.`;
  if (log.type === 'reinforcement_timeout') return `${log.payload?.troops ?? 0} reforços não distribuídos foram perdidos pelo tempo.`;
  if (log.type === 'attack_success') return 'O território foi conquistado com sucesso.';
  if (log.type === 'attack_failed') return 'A defesa inimiga repeliu o ataque.';
  if (log.type === 'troop_movement') return 'Tropas reposicionadas entre territórios conectados.';
  if (log.type === 'player_eliminated') return 'Uma facção foi eliminada da partida.';
  if (log.type === 'match_finished') return 'A partida terminou. Vitória declarada.';
  return log.message ?? 'O estado da partida foi atualizado.';
}

export function GameLogDrawer({ open, onClose, logs }: GameLogDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const reversedLogs = [...logs].reverse();

  return (
    <>
      <div className="game-log-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="game-log-drawer" role="dialog" aria-label="Diário da partida">
        <div className="game-log-header">
          <div className="game-log-title">
            <span className="game-log-title-icon"><Swords size={16} /></span>
            <div>
              <strong>DIÁRIO · REGISTRO</strong>
              <small>{logs.length} eventos registrados</small>
            </div>
          </div>
          <button className="game-log-close" onClick={onClose} aria-label="Fechar Log">
            <X size={16} />
          </button>
        </div>

        <div className="game-log-feed">
          {reversedLogs.length === 0 ? (
            <div className="game-log-empty">
              <p>Nenhuma ação registrada nesta rodada.</p>
            </div>
          ) : (
            reversedLogs.map((log: any, index: number) => (
              <article key={log.id ?? `${log.type}-${index}`} className={`game-log-item is-${log.type}`}>
                <span className="game-log-item-icon">
                  <FeedIcon type={log.type ?? ''} />
                </span>
                <div className="game-log-item-body">
                  <div className="game-log-item-meta">
                    <strong>{logLabels[log.type] ?? 'Atualização'}</strong>
                  </div>
                  <p>{friendlyMessage(log)}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

export function GameLogTrigger({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button className="game-log-trigger-btn" onClick={onClick} aria-label="Abrir log da partida">
      <span>DIÁRIO</span>
      <ChevronUp size={14} />
      {count > 0 && <span className="game-log-badge">{count}</span>}
    </button>
  );
}
