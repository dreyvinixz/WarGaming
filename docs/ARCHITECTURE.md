# Arquitetura — Atlas War

## Visão geral

O projeto possui uma única raiz e dois aplicativos coordenados. O backend é autoritativo; o frontend não decide se uma ação é válida.

```text
apps/web (React/Vite)
  lobby + match board + AtlasMap
        │ REST / WebSocket
        ▼
apps/api (FastAPI)
  rooms → services → game_engine puro
                         │
                         ├─ state.py
                         ├─ map.py
                         ├─ validators.py
                         ├─ combat.py
                         ├─ objectives.py
                         └─ reducer.py
```

## Camadas

### Frontend

`apps/web/src/pages/MatchBoard.tsx` coordena seleção e intenção de ação. `AtlasMap.tsx` apenas renderiza a malha mundial, os nós e os eventos de clique. `services/ws.ts` envia ações e recebe snapshots do servidor.

### Serviço e transporte

`apps/api/app/services` coordena salas e partidas. REST cuida de criação/entrada/início de sala; WebSocket transmite estado e ações durante a partida.

### Motor

`apps/api/app/game_engine` usa uma máquina de estados baseada em cópia imutável dos modelos Pydantic. A regra recebe estado + ação e devolve estado novo ou erro. Não há chamadas de banco, rede ou framework nessa camada.

### Dados

O estado da partida pode ser persistido como JSON no modelo de match. O mapa atual mantém adjacência, regiões, posições e tropas no backend; o frontend recebe tudo necessário para renderizar e selecionar nós.

## Regra de separação do mapa

O `AtlasMap` tem apenas um mapeamento de apresentação (`N1 → ca`, `I1 → br`, etc.) para a primeira integração. A adjacência oficial continua em `apps/api/app/game_engine/map.py`. Para migrar para países completos, primeiro atualize o modelo de mapa e os testes do motor; depois remova o mapeamento temporário do frontend.
