# Atlas War

Atlas War é um jogo de estratégia por turnos para navegador, inspirado no gênero de conquista territorial e construído sobre o mapa mundial do **Atlas Vivo**. O jogador distribui tropas, ataca territórios adjacentes, movimenta unidades e cumpre objetivos em partidas locais ou online.

O repositório é um monorepo com uma única visão de produto:

- `apps/web`: lobby, sala e tabuleiro React/Vite com o mapa mundial do Atlas Vivo.
- `apps/api`: FastAPI, WebSocket, persistência e motor de regras autoritativo.
- `docs`: decisões de produto, regras, arquitetura, API, segurança e roadmap.

## Estado atual

O motor de partida, salas, WebSocket, combate, reforços, movimentação, objetivos e testes já existem. O frontend foi atualizado para usar o Atlas Vivo como tabuleiro visual; nesta primeira integração, os 13 nós do mapa do motor são posicionados em âncoras geográficas no mapa mundial. A migração para territórios-país completos está planejada e não deve ser feita misturando regras no componente visual.

## Rodar localmente

### API

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"
pytest -q
uvicorn app.main:app --reload
```

### Web

```bash
cd apps/web
npm install
npm run dev
```

Variáveis opcionais:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```

## Fluxo de jogo

1. Criar ou entrar em uma sala.
2. O host inicia a partida.
3. Na fase de reforço, colocar tropas em um território próprio.
4. Na fase de ataque, escolher origem e alvo adjacente.
5. Na fase de movimento, transferir tropas entre territórios próprios conectados.
6. Encerrar o turno e verificar o objetivo.

## Decisões importantes

- O backend é a fonte de verdade: o cliente exibe estado e envia ações.
- O motor em `apps/api/app/game_engine` não conhece React, FastAPI ou WebSocket.
- O mapa SVG é uma camada visual; adjacência e regras continuam no motor.
- O projeto tem identidade própria e não usa nomes, arte ou regras proprietárias de jogos comerciais.

## Documentação

- [Escopo e visão](docs/GAME_DESIGN.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Regras atuais](docs/RULES.md)
- [API e WebSocket](docs/API.md)
- [Mapa Atlas Vivo](docs/ATLAS_MAP.md)
- [Fontes de assets](docs/ASSET_SOURCES.md)
- [Roadmap](docs/ROADMAP.md)

## Licença e uso do mapa

O código deste projeto segue a licença do repositório. A origem e a licença do pacote `@svg-maps/world` devem ser respeitadas separadamente. O Atlas Vivo foi usado como referência visual e fonte da malha SVG no frontend.
