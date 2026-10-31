# Protocolo WebSocket — Atlas War

Conecte em `/ws/rooms/{codigo}?token={player_token}`. O token retornado ao criar ou entrar na sala identifica o participante; conexão sem token válido é recusada com código 1008. Use TLS em produção, pois o token é transmitido na URL.

Após conectar a uma partida iniciada, o servidor envia `match_state_updated` com `state`. O mesmo evento é enviado após cada ação válida, individualmente para cada cliente: `objectives` contém apenas o objetivo do destinatário e `objective_id` dos demais jogadores é omitido. A reconexão recebe o estado persistido atual. Partidas anteriores sem `map_id` são interpretadas como `atlas_legacy_v1`; a correspondência de identidade nessas partidas usa o nome registrado na sala.

Envie `{ "type": "place_reinforcement", "payload": { "territory_id": "W01", "troops": 1 } }`. Outros tipos: `advance_phase`, `attack` (`source_id`, `target_id`, `attacking_troops`), `move_troops` (`source_id`, `target_id`, `troops`) e `end_turn`. O servidor valida turno, fase e regras. Ações recusadas retornam `action_rejected` com `reason` apenas ao remetente.

`atlas_world_v1` possui versão 1, 36 territórios e seis regiões; `atlas_legacy_v1` preserva o tabuleiro de 13 territórios. A sala só pode ser iniciada pelo anfitrião autenticado e com pelo menos dois participantes.

Novas salas usam `atlas_world_v2` (versão 2): mapa geográfico de 36 territórios. Partidas `atlas_world_v1` mantêm a grade original.
