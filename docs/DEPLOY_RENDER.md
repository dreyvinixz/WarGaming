# Publicar Atlas War no Render

Este deploy publica **React/Vite, FastAPI e WebSockets na mesma URL HTTPS**, usando uma única instância web Docker e Postgres gerenciado.

## Deploy

1. No [Render Dashboard](https://dashboard.render.com/), escolha **New > Blueprint** e conecte o repositório `dreyvinixz/WarGaming`.
2. Selecione a branch `feat/game-ui-redesign-v2` (que contém `render.yaml`) e aponte o Blueprint para `render.yaml` na raiz.
3. Confira os dois recursos que serão criados: web service `atlas-war-game` e Postgres `atlas-war-db`, ambos no plano `free`. **Não aceite um plano pago sem querer.**
4. Confirme **Apply**. Quando o deploy concluir, o Render exibirá a URL pública real do serviço (normalmente um endereço `onrender.com`).
5. Teste `https://SUA-URL/api/v1/health` (deve retornar `status: ok`) e abra `https://SUA-URL/`. Em dois navegadores diferentes, crie uma sala e entre nela para verificar o WebSocket seguro (`wss://`).

O Dockerfile `Dockerfile.render` compila o Vite e coloca os arquivos em `/app/static`. O FastAPI entrega o jogo em `/`, a API em `/api/v1`, e WebSockets em `/ws`. No deploy de produção o frontend usa URLs relativas ao mesmo domínio. O banco Postgres entra automaticamente via variável `DATABASE_URL` vinculada ao Blueprint.

## Limitações importantes do plano gratuito

- O serviço web adormece após cerca de **15 minutos sem tráfego**. O primeiro acesso pode demorar cerca de um minuto para iniciar. Não é hospedagem 24/7.
- O Postgres gratuito **expira após 30 dias** (14 dias de prazo para upgrade; depois os dados podem ser excluídos). Para preservar partidas permanentemente, atualize para um banco pago ou use Postgres externo persistente.
- WebSockets ativos podem ser desconectados em reinícios, deploys ou períodos de inatividade; o frontend tenta reconectar. Uma única instância é necessária até migrar o gerenciador de conexões para pub/sub compartilhado.
- A criação de tabelas ocorre na inicialização com `Base.metadata.create_all`; não há migrações Alembic configuradas. Migrações devem ser adicionadas antes de mudanças complexas de esquema.
- Não há garantia de escalabilidade e disponibilidade no plano gratuito.

## Desenvolvimento local

Frontend: `cd apps/web && npm ci && npm run dev`.

Backend: `cd apps/api && pip install -e . && uvicorn app.main:app --reload`.

No modo de desenvolvimento, o cliente aponta por padrão para `http://localhost:8000/api/v1` e `ws://localhost:8000/ws`; para destinos diferentes, defina `VITE_API_URL` e `VITE_WS_URL`.
