# Regras atuais — Atlas War

## Tabuleiro

O tabuleiro é o mapa mundial do Atlas Vivo. Nesta versão, ele apresenta 13 territórios estratégicos conectados por adjacência no motor. Cada território tem proprietário, quantidade de tropas, região e lista de vizinhos.

## Fases do turno

### Reforço

O jogador ativo recebe tropas calculadas pelo número de territórios controlados e pelos bônus de regiões completas. Ele deve colocar todo o pool antes de avançar.

### Ataque

O ataque parte de território próprio para território inimigo adjacente. O território de origem precisa manter pelo menos uma tropa. O combate usa rolagem de ataque e defesa no motor; o resultado é registrado no log.

### Movimentação

O jogador pode mover tropas entre territórios próprios conectados, mantendo pelo menos uma tropa na origem. A versão atual limita a uma movimentação por turno.

### Encerramento

Ao encerrar, o motor verifica eliminação, objetivo e passa o turno para o próximo jogador ativo.

## Objetivos

O motor possui objetivos de controle de quantidade de territórios, controle de regiões específicas e eliminação de jogadores. Eles são avaliados no encerramento do turno.

## Limites intencionais do MVP

Não há cartas, diplomacia, névoa de guerra ou unidades especializadas. O objetivo é validar o tabuleiro, o fluxo e o combate antes de expandir o conjunto de regras.
