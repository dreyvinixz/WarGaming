# Fontes de assets e direção de arte

Os assets abaixo foram selecionados para complementar o Atlas Vivo sem substituir a identidade própria do Atlas War.

## Candidatos recomendados

- [Kenney UI Pack](https://kenney.nl/assets/ui-pack) — painéis, botões, sliders e peças de interface. Licença CC0.
- [Game Icon Pack — Nieobie](https://nieobie.itch.io/free-icons) — ícones arredondados para ações, objetivos e estados. Licença CC0.
- [GUI Graphics Kit Free — Jamie Cross](https://jamiecross.itch.io/graphical-user-interface-graphics-kit-free) — janelas, barras, botões e elementos vetoriais. Licença CC0.
- [OpenGameArt — pesquisa com licença CC0](https://opengameart.org/art-search-advanced?keys=&field_art_licenses_tid%5B%5D=4) — referência para bandeiras, marcadores e elementos de cenário.

## Uso no produto

1. Baixar apenas o pack original ou fonte oficial.
2. Conferir a licença dentro do arquivo antes de adicionar ao repositório.
3. Copiar somente os elementos usados para `apps/web/public/assets/`.
4. Registrar o autor, URL, licença e arquivo utilizado em `docs/LEGAL.md`.
5. Preferir SVG para ícones e PNG/WebP apenas para ilustrações ou texturas.

## Decisão atual

A primeira camada do redesign usa CSS, SVG do Atlas Vivo e `lucide-react` para validar a experiência. Isso reduz dependência de arte provisória e permite testar hierarquia, onboarding e leitura do mapa antes de escolher um pacote visual definitivo.

### Mapa histórico da tela inicial
- "The world (Mercator), 1926", London Atlas of Universal Geography, edição Whitehall. Wikimedia Commons: https://commons.wikimedia.org/wiki/File:The_world_(Mercator),_1926.jpg
- Identificado na página da fonte como domínio público (Public Domain Mark). Usado como textura de fundo; não representa o tabuleiro jogável.

### Arte de campanha e tipografia
- `apps/web/public/assets/campaign/`: `campaign-art.png`, `campaign-war.webp` e `army-standard.png`, ilustrações originais geradas para Atlas War, sem uso de imagens dos jogos de referência. `campaign-war.webp` é o poster/fallback do vídeo no menu principal.
- `apps/web/public/assets/campaign/campaign-loop.mp4`: clipe de campanha fornecido para o Atlas War, preparado para começar a reprodução progressiva no menu; reproduz sem áudio e em loop.
- `apps/web/public/assets/maps/world-atlas-1926.jpg`: mapa histórico da tela inicial.
- `assets/concept-art/grow.png` e `assets/backgrounds/16391-271607398_small.mp4`: materiais de referência mantidos fora da pasta pública da aplicação.
- `assets/ui/atlas-crest.svg`, `assets/ui/ornate-divider.svg`, `assets/map/sea-chart.svg`, `assets/map/compass-rose.svg`, `assets/tokens/troop-token-frame.svg` e `assets/combat/die-red.svg` / `die-blue.svg`: vetores originais criados para Atlas War nesta etapa.
- Barlow Condensed e Cinzel: pacotes Fontsource auto-hospedados sob SIL Open Font License 1.1. Os avisos completos acompanham a aplicação em `apps/web/public/assets/licenses/`.
- Removemos a dependência runtime de Google Fonts; os estilos usam os arquivos tipográficos locais.

### Materiais avaliados nos repositórios de referência
- [`lan-games`](https://github.com/kbennett2000/lan-games): licença MIT para o software do repositório. Seu SVG de tabuleiro Risk é baseado em cartografia de terceiros; a licença MIT do repositório não substitui a atribuição CC BY-SA dessa cartografia.
- [`risk-game`](https://github.com/daniel3303/risk-game): os créditos identificam a geometria cartográfica como CC BY-SA 4.0, com atribuição e compartilhamento pela mesma licença. Não copiamos essa geometria nesta etapa porque o mapa do Atlas War tem outra topologia e quantidade de territórios.
- Os retratos e a miniatura de infantaria do `risk-game` não foram copiados: os créditos os descrevem como arte criada para aquele projeto, mas não concedem uma licença de reutilização.
- Os frontends de [`go-risk-it-frontend`](https://github.com/go-risk-it/go-risk-it-frontend) e [`playgrid`](https://github.com/dkirby-ms/playgrid) não apresentavam uma licença explícita nos arquivos consultados; foram usados apenas como referência de produto, sem copiar seus arquivos.
