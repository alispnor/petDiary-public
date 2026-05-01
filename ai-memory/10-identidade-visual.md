# 10 — Identidade Visual e Assets

## Logo source

- **Arquivo mestre:** `logotipo/petDiaryLogo.png` (1024×1024, RGBA)
- **Conceito:** duas patas (azul-teal + laranja, gradiente), sobre cruz médica, envoltas por rede de pontos/linhas (representa a IA / dados conectados)
- **Significado das 3 camadas visuais:**
  - **Patas:** o pet, o sujeito do produto
  - **Cruz médica:** o lado clínico/saúde
  - **Rede de pontos:** o sistema digital + IA que conecta tudo

## Paleta oficial (extraída do logotipo)

> Definida em 2026-05-01 pelo Ali. **Use estes valores** — não invente novos tons.

| Token | Hex | Uso |
|---|---|---|
| `--color-brand-teal` | `#24b6d4` | Acento primário, ícones de saúde/tech |
| `--color-brand-teal-dark` | `#168b9f` | Hover do teal |
| `--color-brand-orange` | `#f27339` | CTA de energia/acolhimento |
| `--color-brand-orange-dark` | `#cc541d` | Hover do laranja |
| `--gradient-primary` | `linear-gradient(135deg, teal → orange)` | Botões primários, ícones de marca, texto destacado |
| `--color-bg-app` | `#f4f1eb` | Fundo principal da tela (off-white neumórfico) |
| `--color-surface` | `#fdfcf9` | Cards |
| `--color-surface-elevated` | `#ffffff` | Modais e popups |
| `--color-text-primary` | `#2d3748` | Texto principal (cinza-azulado, evita preto puro) |
| `--color-text-secondary` | `#718096` | Subtítulos e dicas |
| `--color-text-inverse` | `#ffffff` | Texto sobre fundo colorido |

### Tipografia

- **Família:** `Nunito` (Google Fonts) — terminais arredondados → amigável + clínico
- **Pesos:** 400, 500, 600, 700, 800
- **Web:** carregado via `@import` em `global.css`
- **Mobile:** ainda não carregado — instalar `@expo-google-fonts/nunito` quando ligar

### Raios de borda

| Token | Valor | Quando usar |
|---|---|---|
| `--radius-sm` | 8px | inputs, badges pequenos |
| `--radius-md` | 16px | **cards de pets (padrão)** |
| `--radius-lg` | 24px | modais, painéis amplos |
| `--radius-pill` | 9999px | botões e tags arredondados |

### Sombras

- `--shadow-card-soft` → cards normais
- `--shadow-neumorphic` → uso pontual em destaques (efeito tátil)

## Onde estão definidos

| Camada | Arquivo | Como usar |
|---|---|---|
| Web | `petDiary-frontend-web/src/styles/global.css` | CSS vars + tokens Tailwind v4 (`bg-brand-teal`, `font-base`, `rounded-md`) |
| Web (entry) | `petDiary-frontend-web/src/index.css` | Importa `tailwindcss` + `global.css` |
| Mobile | `petDiary-frontend-mobile/src/theme/index.ts` | `import { colors, radii, shadows } from '@/theme'` |

### Utilitários CSS prontos (web)

```css
.text-gradient   /* texto com gradiente da marca */
.btn-primary     /* botão principal com gradiente */
.card            /* card com surface + sombra suave */
.surface-neu     /* superfície neumórfica */
```

### Utilitários do tema (mobile)

```ts
import theme, { colors, brand, gradients, radii, shadows } from '../theme';

<View style={{ backgroundColor: colors.bg.surface, borderRadius: radii.md, ...shadows.card }} />

// Para gradiente, instalar `expo-linear-gradient`:
<LinearGradient colors={gradients.primary} start={{x:0,y:0}} end={{x:1,y:1}} />
```

## Tokens antigos (em uso no código atual — A MIGRAR)

Telas atuais ainda usam paleta antiga (`#4A90D9`, `indigo-600`, `#5CB85C`, `#F0AD4E`). **Devem ser migradas** para os tokens oficiais nas próximas iterações:

| Antigo | Novo |
|---|---|
| `#4A90D9` (azul card pet) | `var(--color-brand-teal)` ou `colors.brand.teal` |
| `indigo-600` (Tailwind) | `bg-brand-teal` ou `bg-gradient-primary` |
| `#5CB85C` (verde "Adicionar") | `var(--color-brand-teal)` |
| `#F0AD4E` (amarelo "PIN") | `var(--color-brand-orange)` |
| `#F5F7FA` (cinza fundo) | `var(--color-bg-app)` (`#f4f1eb`) |
| `#1A1A2E` (texto título) | `var(--color-text-primary)` (`#2d3748`) |

## Geração de ícones

Script: `logotipo/generate-icons.py`. Roda com `python3` + Pillow (já disponível na máquina).

```bash
python3 logotipo/generate-icons.py
```

Lê `logotipo/petDiaryLogo.png` e regenera **todos** os assets do projeto. Idempotente — pode rodar quantas vezes quiser.

## Assets gerados (locais finais)

### Mobile (Expo) — `petDiary-frontend-mobile/assets/`
| Arquivo | Tamanho | Uso |
|---|---|---|
| `icon.png` | 1024×1024 | iOS app icon |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon (com 15% de padding interno) |
| `splash.png` | 1284×2778 | Splash screen (logo centralizado em fundo `#F3F5F8`) |
| `favicon.png` | 48×48 | Web build do Expo |

Configurado em `petDiary-frontend-mobile/app.json` (campos `icon`, `splash`, `android.adaptiveIcon`, `web.favicon`).

### Web (Vite) — `petDiary-frontend-web/public/`
| Arquivo | Uso |
|---|---|
| `favicon.ico` | Ícone principal (multi-tamanho 16/32/48/64) |
| `favicon-16.png` / `favicon-32.png` | PNG fallback explícito |
| `apple-touch-icon.png` (180×180) | iOS Safari "adicionar à tela inicial" |
| `logo-192.png` / `logo-512.png` | PWA (referenciados no `manifest.webmanifest`) |
| `manifest.webmanifest` | PWA — nome, cores, ícones |

Configurado em `petDiary-frontend-web/index.html` (`<link rel="icon">`, `<link rel="manifest">`).

### Exports utilitários — `logotipo/exports/`
| Arquivo | Uso sugerido |
|---|---|
| `round-512.png` | Avatar circular (Slack, GitHub org) |
| `banner-1280x640.png` | Banner do repositório no GitHub (Settings → Social preview) |
| `logo-256.png` / `128.png` / `64.png` | Para uso em apresentações, README, emails |

## Como adicionar/regenerar assets

1. Substituir `logotipo/petDiaryLogo.png` por uma versão atualizada (mantenha 1024×1024 com fundo transparente ou claro)
2. Rodar `python3 logotipo/generate-icons.py`
3. Pronto — todos os locais são atualizados

Se precisar de **novos tamanhos**, basta editar `generate-icons.py` (qualquer SDE consegue ler o script — é direto).

## Pendentes / ideias

- [ ] Versão **monocromática** do logo (preto puro) para impressões e watermarks
- [ ] Versão **sem fundo** (PNG transparente puro, sem o card iOS) — útil pra header de e-mails
- [ ] Versão **horizontal** com texto "petDiary" ao lado do ícone (logotipo completo)
- [ ] Splash animado (Lottie) para o mobile na Fase 2
- [ ] OG image para compartilhamento social (1200×630, com tagline)
