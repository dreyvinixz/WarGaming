# Game Design — Atlas War

## Visão

Atlas War transforma o mapa mundial do Atlas Vivo em um centro de comando para um jogo de conquista territorial por turnos. A partida deve ser rápida de entender, legível em uma tela e suficientemente estratégica para criar decisões claras entre reforçar, atacar e mover tropas.

## Pilares

1. **Mapa vivo:** o mundo é a interface principal; seleção, tropas, controle e alvos devem aparecer diretamente nele.
2. **Regras verificáveis:** o servidor valida toda ação e o motor pode ser testado sem rede.
3. **Leitura imediata:** cores, marcadores, fase atual e log explicam o estado sem depender de tutorial.
4. **Identidade própria:** inspiração no gênero de conquista, sem copiar nomes, arte ou conteúdo proprietário.

## Loop principal

1. Receber reforços no início do turno.
2. Distribuir tropas em territórios próprios.
3. Atacar um território rival conectado.
4. Mover tropas entre territórios próprios conectados.
5. Encerrar o turno e verificar o objetivo.

## Vocabulário

| Motor | Interface Atlas War |
|---|---|
| Territory | Território |
| Region | Continente / região |
| Troops | Tropas |
| Attack | Ataque |
| Movement | Movimentação |
| Objective | Objetivo |

## Estado do produto

O motor atual trabalha com 13 territórios conectados, organizados em quatro regiões abstratas. O frontend já usa a malha geográfica mundial como tabuleiro visual e ancora esses territórios no mapa. A expansão para países individuais será uma mudança de dados e regras, não uma decisão tomada dentro do componente SVG.
