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
