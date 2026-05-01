# 🖼 Mapa de Imagens do Projeto petDiary

> **Para o Ali:** este documento lista todas as imagens (logos, ícones,
> splash, banners) usadas no projeto, com **caminho físico**, **dimensão
> atual**, **dimensão ideal** e **onde cada uma é usada**.
>
> **Como substituir:** mantenha o mesmo nome de arquivo e o mesmo caminho.
> Apenas troque o conteúdo binário (mesma extensão `.png`/`.ico`).
> Idealmente respeite a dimensão recomendada (mais detalhes embaixo).

Última auditoria: **2026-05-01**

---

## 📌 Resumo dos arquivos-fonte (master)

Estes são os **logos originais** que o Ali entrega. Todos os outros
tamanhos são gerados a partir destes pelo script
`scripts/generate-icons.py` (se existir) ou manualmente pelo Ali.

| Arquivo | Dimensão atual | Dimensão ideal | Tipo | Cor de fundo | Notas |
|---|---|---|---|---|---|
| `logotipo/petDiaryLogo.png` | 2048×2048 | **2048×2048** | PNG transparente | transparente | **Master CLARO** — logo principal sobre fundo claro |
| `logotipo/petDiaryLogoDark.png` | 2048×2048 | **2048×2048** | PNG transparente | transparente | **Master ESCURO** — logo para fundos escuros |
| `logotipo/petDiaryLogoicon.png` | 1024×1024 | **1024×1024** | PNG transparente | transparente | Versão "ícone" simplificada (sem texto, só símbolo) |

**Recomendações para os masters:**
- PNG-24 com canal alfa (transparente)
- 72 dpi (não importa dpi para web/mobile, só pixels)
- Otimizar com `pngcrush` ou `tinypng.com` antes de subir
- O master CLARO deve ficar legível sobre fundo branco/claro
  (cor de marca: `#24b6d4` teal e `#f27339` laranja)
- O master ESCURO deve ficar legível sobre fundo preto/escuro
- O ícone (`Logoicon.png`) tem que ficar legível em **40×40 pixels**
  (tamanho do botão de menu no mobile) — testar em escala pequena!

---

## 📂 Imagens DERIVADAS (geradas a partir dos masters)

Substitua estes arquivos **mantendo o mesmo nome e a mesma dimensão**.
Se quiser regerar a partir dos masters, use o script `scripts/generate-icons.py`
(se existir) ou exporte manualmente do Figma/Photoshop.

### 🟢 1. Web (`petDiary-frontend-web/public/`)

Servidos como arquivos estáticos pelo Vite.

| Arquivo | Dimensão atual | Dimensão ideal | Onde aparece | Tipo recomendado |
|---|---|---|---|---|
| `petDiary-frontend-web/public/favicon.ico` | 16×16 | **16×16, 32×32, 48×48** (multi-size ICO) | Aba do browser (legacy) | ICO multi-resolução |
| `petDiary-frontend-web/public/favicon-16.png` | 16×16 | **16×16** | Aba do browser (links no `<head>`) | PNG sólido sobre branco |
| `petDiary-frontend-web/public/favicon-32.png` | 32×32 | **32×32** | Aba do browser (HiDPI) | PNG sólido sobre branco |
| `petDiary-frontend-web/public/apple-touch-icon.png` | 180×180 | **180×180** | iOS quando "Add to Home Screen" | PNG SEM transparência (iOS adiciona cantos arredondados) |
| `petDiary-frontend-web/public/logo-192.png` | 192×192 | **192×192** | Logo no header / login / register / etc (USO PRINCIPAL) + manifest PWA | PNG transparente |
| `petDiary-frontend-web/public/logo-512.png` | 512×512 | **512×512** | manifest PWA "Add to Home Screen" Android | PNG transparente |
| `petDiary-frontend-web/public/logo-dark-192.png` | 192×192 | **192×192** | Variação dark (não usado ainda no código, reserva) | PNG transparente |
| `petDiary-frontend-web/public/logo-dark-512.png` | 512×512 | **512×512** | Variação dark (reserva) | PNG transparente |

**Onde o web usa cada arquivo (referências encontradas):**

- `logo-192.png` → header de TutorDashboard, VetEntry; tela de Login,
  Register, ForgotPassword, ResetPassword, ChangePassword (todos via
  `<img src="/logo-192.png">`)
- `favicon-16.png` + `favicon-32.png` → `index.html` (`<link rel="icon">`)
- `apple-touch-icon.png` → `index.html` (`<link rel="apple-touch-icon">`)
- `favicon.ico` → fallback automático em `/favicon.ico`
- `logo-192.png` + `logo-512.png` → `manifest.webmanifest` (PWA)

### 🟢 2. Mobile (`petDiary-frontend-mobile/assets/`)

Empacotados pelo Expo no build do APK/IPA.

| Arquivo | Dimensão atual | Dimensão ideal | Onde aparece | Tipo recomendado |
|---|---|---|---|---|
| `petDiary-frontend-mobile/assets/icon.png` | 1024×1024 | **1024×1024** | App icon (iOS+Android) + USO INTERNO no Login/Register/ForgotPassword (como logo da marca) | PNG **sem transparência** — fundo sólido `#F3F5F8` ou `#FFFFFF` (iOS rejeita transparente) |
| `petDiary-frontend-mobile/assets/icon-dark.png` | 1024×1024 | **1024×1024** | Variação dark (reserva — não usada no app.json hoje) | PNG sem transparência |
| `petDiary-frontend-mobile/assets/adaptive-icon.png` | 1024×1024 | **1024×1024** | Foreground do adaptive icon Android | PNG transparente, conteúdo dentro de **círculo seguro de 660×660** centralizado (Android crops fora) |
| `petDiary-frontend-mobile/assets/splash.png` | 1284×2778 | **1284×2778** (iPhone 14 Pro Max — Expo escala pra outros) | Splash screen ao abrir o app | PNG sólido — usar bg `#F3F5F8` da paleta; logo centralizado |
| `petDiary-frontend-mobile/assets/splash-dark.png` | 1284×2778 | **1284×2778** | Splash quando user está em dark mode (reserva — `app.json` não usa) | PNG sólido fundo escuro |
| `petDiary-frontend-mobile/assets/favicon.png` | 48×48 | **48×48 ou 96×96** | Favicon quando rodar como Web preview (`expo start --web`) | PNG |

**Onde o mobile usa cada arquivo (referências encontradas):**

- `icon.png` → `app.json` (`expo.icon`) E código:
  - `src/screens/Login.tsx:74` — logo da tela
  - `src/screens/Register.tsx:112` — logo da tela
  - `src/screens/ForgotPassword.tsx:53` — logo da tela
- `splash.png` → `app.json` (`expo.splash.image`)
- `favicon.png` → `app.json` (`expo.web.favicon`)
- `adaptive-icon.png` → `app.json` (`expo.android.adaptiveIcon.foregroundImage`)

### 🟢 3. Logos exportados (`logotipo/exports/`)

Tamanhos auxiliares usados em redes sociais, README, apresentações.
**Não são consumidos pelo código** — só para uso institucional.

| Arquivo | Dimensão atual | Dimensão ideal | Para que serve |
|---|---|---|---|
| `logotipo/exports/logo-64.png` | 64×64 | **64×64** | Avatar pequeno em emails/Slack |
| `logotipo/exports/logo-128.png` | 128×128 | **128×128** | Avatar redes sociais |
| `logotipo/exports/logo-256.png` | 256×256 | **256×256** | Reservado |
| `logotipo/exports/round-512.png` | 512×512 | **512×512** | Avatar circular para perfil |
| `logotipo/exports/round-dark-512.png` | 512×512 | **512×512** | Avatar circular para perfil dark mode |
| `logotipo/exports/banner-1280x640.png` | 1280×640 | **1280×640** | OpenGraph (compartilhamento em redes) |
| `logotipo/exports/banner-dark-1280x640.png` | 1280×640 | **1280×640** | OpenGraph para fundos escuros |

---

## 🎨 Diretrizes de qualidade ao substituir

1. **Mantenha as dimensões exatas.** Reduzir uma imagem alta-res no
   código gera blur; aumentar uma baixa-res gera pixelização. Os
   targets exatos estão na coluna "Dimensão ideal".

2. **Otimização de tamanho:**
   - Antes de commitar, passe pelo [tinypng.com](https://tinypng.com)
     ou `pngcrush -reduce` — corta 50-70% sem perda visível
   - Tamanho máximo desejado por arquivo:
     - Favicons (≤32×32): < 2 KB
     - Logos web (192×192): < 50 KB
     - Logos web/mobile (512×512): < 200 KB
     - Splash mobile (1284×2778): < 500 KB
     - Masters (2048×2048): pode ficar até 1 MB

3. **Cor de fundo do app icon mobile (`icon.png`):**
   - **iOS rejeita PNG com canal alfa em app icons.** Use fundo sólido.
   - Recomendação: `#F3F5F8` (mesmo bg do app) para integração visual
   - Se preferir branco puro, use `#FFFFFF`

4. **Adaptive icon Android (`adaptive-icon.png`):**
   - É colocado em cima de uma camada de cor (`backgroundColor` em
     `app.json`, hoje `#F3F5F8`)
   - O Android pode cortar em círculo, squircle, quadrado — **mantenha
     o conteúdo importante dentro de um círculo de 660×660 px** no
     centro do canvas 1024×1024
   - Use PNG transparente

5. **Splash screen (`splash.png`):**
   - Logo centralizado, fundo `#F3F5F8` (cor de marca)
   - Resolução é a do iPhone 14 Pro Max (maior dispositivo) — Expo
     escala pra resoluções menores automaticamente
   - Não inclua texto pequeno (vai ficar ilegível em telas menores)

6. **Apple touch icon (`apple-touch-icon.png`):**
   - iOS adiciona cantos arredondados automaticamente
   - **NÃO use canal alfa** — fundo sólido (preferência: cor de marca
     `#24b6d4` ou branco)
   - 180×180 cobre todos os iPhones; iOS escala pra menores

---

## ✅ Checklist ao substituir

Antes de commitar imagens novas:

- [ ] Mesmo nome de arquivo
- [ ] Mesmo caminho
- [ ] Dimensão exata (linha "Dimensão ideal")
- [ ] PNG otimizado (≤ tamanho recomendado)
- [ ] Para `icon.png` mobile: SEM canal alfa
- [ ] Para `apple-touch-icon.png`: SEM canal alfa
- [ ] Para `adaptive-icon.png`: conteúdo dentro do círculo de 660×660
- [ ] Para `splash.png`: logo centralizado, bg `#F3F5F8`
- [ ] Testou abrindo o app/web depois? (Vite e Metro têm cache —
      hard reload pode ser necessário)

---

## 🔁 Hot reload depois de trocar imagem

- **Web:** Ctrl+Shift+R (hard reload) no browser. O Vite serve `public/`
  estático sem cache, mas o browser tem cache.
- **Mobile (Expo):** sacuda o celular → "Reload". Em alguns casos
  precisa **`docker compose restart mobile`** (Metro guarda cache de
  imagens em `/tmp/metro-cache/`).
- **iOS:** se trocou `icon.png` ou `splash.png`, precisa rebuild EAS.
  Em DEV via Expo Go, esses só atualizam ao re-importar do QR code.
