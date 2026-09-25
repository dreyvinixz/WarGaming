# Roadmap — Atlas War

## Concluído

- [x] Motor puro com reforços, ataques, movimentação, turnos e objetivos.
- [x] Salas REST e sincronização WebSocket.
- [x] Frontend React com lobby e partida.
- [x] Mapa mundial do Atlas Vivo integrado ao tabuleiro.
- [x] Documentação consolidada em uma única visão de produto.

## Transição de Interface: Dashboard ➔ Game HUD (Frontend)

O plano detalhado e estruturado em 4 etapas e 16 tarefas está documentado no [ROADMAP.md](../ROADMAP.md) na raiz do projeto:

- [x] **Etapa 1 — Layout & Arquitetura de Tela:** Viewport do mapa em tela cheia (85-100%), remoção da sidebar permanente, implementação do `GameLogDrawer` retrátil (380px), `TopStatusBar`, `PhaseBanner` flutuante e `ActionDock` inferior.
- [x] **Etapa 2 — Tabuleiro Tático & Estados:** Máquina de estados visual do SVG (`DEFAULT`, `HOVER`, `SELECTABLE`, `SELECTED`, `ATTACKABLE`, `DISABLED`), redesenho de bordas e glow, `TroopBadges` militares escalonados, rotas táticas vetoriais e `TerritoryInspector` contextual.
- [x] **Etapa 3 — Motion & Feedback:** Floating numbers de reforço (`+N`), marching ants animados em vetores de ataque, flash de impacto na conquista de território e pulso de transição de fases.
- [x] **Etapa 4 — Identidade Neo-Military & Polimento:** Atmosfera tática (radar, grid 4%, scanlines sutis), tipografia de comando (`Rajdhani`/`Chakra Petch`) e responsividade avançada.


## Próxima etapa — Atlas jogável completo (Engine & Regras)

- [ ] Migrar os 13 nós abstratos para IDs de países.
- [ ] Definir adjacência mundial e continentes com dados versionados.
- [ ] Atualizar distribuição inicial, bônus e objetivos.
- [ ] Remover o mapeamento temporário de âncoras do frontend.
- [ ] Atualizar testes do motor e o playthrough E2E.

## Depois do mapa completo

- [ ] Melhorar feedback de combate com dados/resultado no painel.
- [ ] Persistência robusta de partidas e reconexão.
- [ ] IA local para preencher partidas.
- [ ] Balanceamento de objetivos e regiões.
- [ ] Acessibilidade completa do SVG e suporte mobile refinado.
