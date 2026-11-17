# video-tutorial-kit

Kit de arquivos usado pelo bot **Vídeo Tutorial Criador**: projeto Remotion (React + three.js) para vídeos
verticais 720x1280 / 30 fps, scripts de apoio (narração, conferência de cenas, quadro de estilos) e as
miniaturas do quadro de estilos.

## Preparar

```bash
git clone --depth 1 --branch v1 https://github.com/pblab-dev/video-tutorial-kit.git
cd video-tutorial-kit
npm ci
```

(No Computador do bot a preparação é automática: o bot clona o kit na pasta de trabalho se `scripts/` não existir.)

## O que tem

| Pasta | Conteúdo |
|---|---|
| `src/` | composições Remotion (`Root.jsx` registra todas) e peças reutilizáveis (`kit.jsx`, `fonts.jsx`) |
| `public/fonts/` | Montserrat e JetBrains Mono (licença OFL, texto junto dos arquivos) |
| `content/` | roteiros/tempos de exemplo e `glossario-pronuncia.json` |
| `scripts/` | quadro e cards de estilos, conferência de cenas, transcrição de áudio, glossário de pronúncia |
| `work/styles/` | `quadro_estilos.jpg` e `cards/` (22 miniaturas dos estilos) |

## Renderizar

```bash
npx remotion render src/index.jsx <Composicao> out/video.mp4
```

Os áudios de narração dos vídeos de exemplo não estão no kit: cada vídeo novo gera a sua própria narração
(`public/<tema>/voz.mp3` + `content/<tema>/timeline.json`).

## Licenças e o que ficou de fora

Veja `THIRD_PARTY.md`.
