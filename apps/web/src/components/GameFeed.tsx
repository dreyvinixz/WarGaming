import { Bell, CheckCircle2, Flag, Swords, Users } from 'lucide-react';

const logLabels: Record<string, string> = {
  match_started: 'Partida iniciada',
  turn_started: 'Novo turno',
  turn_ended: 'Turno encerrado',
  phase_changed: 'Fase avançada',
  reinforcement: 'Reforço enviado',
  attack_success: 'Território conquistado',
  attack_failed: 'Ataque repelido',
  troop_movement: 'Tropas movidas',
  player_eliminated: 'Jogador eliminado',
  match_finished: 'Partida encerrada',
};

const phaseLabels: Record<string, string> = {
  reinforcement: 'reforço',
  attack: 'ataque',
  movement: 'movimentação',
};

function FeedIcon({ type }: { type: string }) {
  if (type.includes('attack') || type === 'player_eliminated') return <Swords size={15} />;
  if (type.includes('reinforcement') || type === 'troop_movement') return <Flag size={15} />;
  if (type.includes('turn')) return <Users size={15} />;
  if (type === 'match_finished') return <CheckCircle2 size={15} />;
  return <Bell size={15} />;
}

function friendlyMessage(log: any) {
  const territory = log.payload?.territory_id ?? 'território';
  if (log.type === 'match_started') return 'A partida começou. O mapa está aberto para disputa.';
  if (log.type === 'turn_started') return `Rodada ${log.payload?.round ?? ''} iniciada com ${log.payload?.reinforcement_pool ?? 0} reforços.`;
  if (log.type === 'turn_ended') return 'O turno foi encerrado e o mapa avançou.';
  if (log.type === 'phase_changed') return `A fase mudou para ${phaseLabels[log.payload?.phase] ?? 'a próxima etapa'}.`;
  if (log.type === 'reinforcement') return `Reforços enviados para ${territory}.`;
  if (log.type === 'attack_success') return 'O território foi conquistado com sucesso.';
  if (log.type === 'attack_failed') return 'A defesa inimiga repeliu o ataque.';
  if (log.type === 'troop_movement') return 'Tropas reposicionadas entre territórios conectados.';
  if (log.type === 'player_eliminated') return 'Uma facção foi eliminada da partida.';
  if (log.type === 'match_finished') return 'A partida terminou. Temos um vencedor.';
  return log.message ?? 'O estado da partida foi atualizado.';
}

export function GameFeed({ logs }: { logs: any[] }) {
  const visibleLogs = [...logs].reverse().slice(0, 8);

  return <section className="feed-card panel-card">
    <div className="panel-heading"><div><span className="section-kicker">CENTRAL DE COMANDO</span><h2>Feed da partida</h2></div><span className="feed-live"><i /> AO VIVO</span></div>
    <div className="feed-list">
      {visibleLogs.length === 0 && <p className="empty-state">As movimentações da partida aparecerão aqui.</p>}
      {visibleLogs.map((log: any, index) => <article className="feed-item" key={log.id ?? `${log.type}-${index}`}>
        <span className={`feed-icon feed-${log.type}`}><FeedIcon type={log.type ?? ''} /></span>
        <div><strong>{logLabels[log.type] ?? 'Atualização da partida'}</strong><p>{friendlyMessage(log)}</p></div>
      </article>)}
    </div>
  </section>;
}
