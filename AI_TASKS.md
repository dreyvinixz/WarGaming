# Tarefas para agentes — Atlas War

## Regras de trabalho

- Leia `README.md` e os documentos em `docs/` antes de alterar o domínio.
- Preserve o backend autoritativo e o motor puro.
- Não mova regras para componentes React.
- Não crie um segundo app fora de `apps/web`.
- Toda mudança de regra deve incluir testes no backend.
- Toda mudança visual que altera o fluxo deve ser verificada no navegador.

## Prioridade atual

1. **Frontend / UX:** Executar a transição de Dashboard para Game HUD (conforme [ROADMAP.md](file:///c:/Users/User/wargaming/ROADMAP.md)).
2. **Engine / Backend:** Migrar o grafo estratégico de 13 nós para países do Atlas Vivo sem quebrar salas, WebSocket, objetivos ou o playthrough existente.

## O que evitar

- Reintroduzir um tema espacial ou outro escopo fora do Atlas War.
- Tratar a malha SVG como fonte de adjacência.
- Alterar o estado de tropas apenas no cliente.
- Copiar nomes, arte ou regras proprietárias de jogos comerciais.
