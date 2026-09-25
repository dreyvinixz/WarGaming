# Mapa Atlas Vivo

## Fonte

O mapa visual vem da mesma abordagem usada no projeto `C:\Users\User\tripscope`: o pacote `@svg-maps/world` fornece `viewBox`, países e paths SVG.

## Integração atual

O motor mantém os IDs estratégicos `N1`, `N2`, `N3`, `I1`, `I2`, `I3`, `C1`, `C2`, `C3`, `C4`, `S1`, `S2` e `S3`. O frontend usa uma tabela de âncoras para posicioná-los em países do mapa mundial. As linhas de adjacência continuam sendo desenhadas a partir de `territory.neighbors` recebido do backend.

## Por que a integração é temporária

O mapa visual tem mais países do que o grafo atual. Pintar cada país como território jogável antes de definir adjacência, regiões, distribuição inicial, objetivos e testes causaria divergência entre interface e regras. A expansão deve começar no motor e só então refletir no SVG.

## Próximo formato

Quando a migração para países for aprovada, cada território deverá possuir `country_id`, nome localizado, região/continente, vizinhos e posição derivada do mapa. O componente visual deixará de conhecer IDs abstratos.
