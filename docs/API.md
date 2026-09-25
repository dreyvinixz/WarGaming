# API — Atlas War

Base REST: `/api/v1`

## Salas

### `POST /rooms`

Cria uma sala e retorna o código, o token do host e o jogador criado.

```json
{ "player_name": "Jogador Amarelo", "max_players": 4, "map_id": "atlas_world_v1" }
```

### `POST /rooms/{room_code}/join`

Adiciona um jogador a uma sala em espera.

```json
{ "player_name": "Jogador Ciano" }
```

### `POST /rooms/{room_code}/start`

Inicia a partida. Requer o token do host.

## WebSocket

Conexão: `ws://localhost:8000/ws/rooms/{room_code}?player_name={nome}`

Ações enviadas pelo cliente:

```json
{ "type": "place_reinforcement", "payload": { "territory_id": "N1", "troops": 2 } }
{ "type": "attack", "payload": { "source_id": "N1", "target_id": "N2", "attacking_troops": 1 } }
{ "type": "move_troops", "payload": { "source_id": "N1", "target_id": "C1", "moving_troops": 1 } }
{ "type": "advance_phase", "payload": {} }
{ "type": "end_turn", "payload": {} }
```

Eventos principais:

- `match_state_updated`: snapshot completo da partida.
- `action_rejected`: ação inválida e motivo.

O frontend nunca deve atualizar tropas localmente como fonte definitiva; ele aguarda o snapshot do servidor.
