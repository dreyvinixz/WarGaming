# Mapas Atlas War

Novas salas usam `atlas_world_v2`, um mapa geográfico de 36 territórios em seis regiões, com adjacências validadas pelo servidor. Os dados de regras estão em `apps/api/app/game_engine/world_v2.json` e as áreas visuais em `apps/web/src/components/map/world_v2.json`. Seis pares adjacentes do mapa original foram unidos; as conexões foram ajustadas para refletir essas uniões.

A cartografia deriva de [Risk game board.svg](https://commons.wikimedia.org/wiki/File:Risk_game_board.svg), de CMG Lee e Gr0gmint, obtida por meio de [daniel3303/risk-game](https://github.com/daniel3303/risk-game). Geometria e adaptações estão sob [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Alterações: união de seis pares, nomes, agrupamento por região e apresentação visual.

Partidas `atlas_world_v1` mantêm a grade de 36 territórios anterior; partidas `atlas_legacy_v1` mantêm o mapa de 13 territórios. O desenho geográfico não é carregado sobre partidas antigas porque suas fronteiras e regras são diferentes.
