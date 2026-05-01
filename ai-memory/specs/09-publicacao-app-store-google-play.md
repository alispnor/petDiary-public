# Spec 09 — Publicação no Apple App Store + Google Play (APK + IPA)

> Pedido do Ali em 2026-05-01: "escrever o que precisa para criar APK e app para publicar no Google Store e Apple Store em detalhes".

---

## Objetivo

Documento `PUBLICACAO-APPS.md` na raiz do projeto cobrindo TODO o processo para colocar o petDiary mobile (Expo) nas duas lojas, do build ao approve.

---

## Pré-requisitos

### Contas
- **Apple Developer Account** — $99/ano (https://developer.apple.com)
  - Acesso: App Store Connect, Transporter, certificados, provisioning profiles
- **Google Play Console** — $25 one-time (https://play.google.com/console)
- **Conta Expo** (gratuita) — https://expo.dev — para EAS Build
- **Nubank PJ** ou conta empresarial para receber pagamentos (gateway Asaas/MP)

### Documentação obrigatória (ambas lojas)
- **Política de Privacidade** hospedada em URL pública (LGPD-compliant)
- **Termos de Uso**
- **Endereço de suporte** (email + URL)
- **Categorização** (Saúde e Forma Física → Animais de estimação)
- **Classificação etária** (Livre 4+)

### Conformidade
- **LGPD** (BR) — política, exportação/exclusão de dados (DELETE /users/me/ — Spec 01)
- **GDPR** (EU se publicar na UE) — mesmo padrão
- **App Store Review Guidelines** — apps com features médicas precisam de aviso "não substitui consulta veterinária"
- **Google Play Sensitive Permissions Declaration** — câmera/microfone/galeria devem ter justificativa

---

## Plano em 8 fases

### Fase P.1 — Preparar app.json + assets
- `app.json`:
  - `name: "PetDiary"`
  - `slug: "petdiary"`
  - `version: "1.0.0"` (semver — bump a cada release)
  - `runtimeVersion: { policy: "appVersion" }`
  - `ios.bundleIdentifier: "com.petdiary.mobile"` (já configurado)
  - `android.package: "com.petdiary.mobile"` (já configurado)
  - `ios.buildNumber: "1"` (incrementa a cada submit)
  - `android.versionCode: 1`
- Assets já gerados (Fase identidade visual): icon 1024×1024, adaptive-icon, splash 1284×2778
- **Permissões** (Spec 05 captura mídia):
  ```json
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "PetDiary precisa da câmera para fotografar receitas, exames e documentos do seu pet.",
      "NSMicrophoneUsageDescription": "Para gravar áudio de sintomas e diário falado do pet.",
      "NSPhotoLibraryUsageDescription": "Acessar fotos existentes para anexar ao prontuário do pet."
    }
  }
  ```

### Fase P.2 — Configurar EAS Build
```bash
npm install -g eas-cli
eas login
cd petDiary-frontend-mobile
eas build:configure
```

`eas.json`:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" },
      "ios": {}
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "ali@guep.com.br",
        "ascAppId": "<APP_STORE_CONNECT_ID>",
        "appleTeamId": "<TEAM_ID>"
      }
    }
  }
}
```

### Fase P.3 — Build internal (testar antes de subir)
```bash
# Android APK para teste local
eas build --platform android --profile preview

# iOS para simulador
eas build --platform ios --profile preview
```

### Fase P.4 — Beta testing
**Android — Internal Testing:**
```bash
eas build --platform android --profile production
eas submit --platform android --track internal
```
- Adicionar emails de testers no Play Console → Internal testing → Testers
- Eles recebem link e instalam direto

**iOS — TestFlight:**
```bash
eas build --platform ios --profile production
eas submit --platform ios
```
- Apple processa em ~30 min
- Adicionar testers no App Store Connect → TestFlight → Testers
- Eles recebem convite via TestFlight app

### Fase P.5 — Coletar feedback do beta
- 1-2 semanas mínimo
- Crashlytics ou Sentry para tracking de erros
- Form de feedback in-app (Spec 03 — Central de Ajuda)

### Fase P.6 — Submissão final

**Android — Production:**
1. Play Console → Production → Create release
2. Upload do bundle (.aab) — vem do EAS
3. Preencher:
   - **Título:** PetDiary
   - **Descrição curta** (80 chars): "Prontuário médico do seu pet, sempre no seu bolso."
   - **Descrição completa** (4000 chars): com benefícios, features, palavras-chave
   - **Screenshots:** mín. 2 por dispositivo (telefone + tablet 7" + 10")
   - **Ícone alta-res** 512×512
   - **Banner feature** 1024×500
4. Content rating questionnaire
5. Privacy policy URL
6. Data safety declaration
7. Target audience (idade 13+ se houver social; 4+ se for só clínico)
8. Submeter para revisão (1-3 dias)

**iOS — App Store:**
1. App Store Connect → My Apps → New App
2. Bundle ID, primary language (pt-BR), nome
3. App Information:
   - Category: Health & Fitness
   - Subcategory: Medical (se passar review)
4. Pricing: Free ou Freemium (Spec 01)
5. Versão 1.0:
   - **What's New** (release notes)
   - Screenshots (4 tamanhos: iPhone 6.7", 6.5", 5.5", iPad Pro 12.9")
   - Description
   - Keywords (separados por vírgula)
   - Support URL
   - Marketing URL (opcional)
6. App Review Information:
   - Conta de teste (TUTOR + VET) com credenciais
   - Notas explicando o fluxo de PIN
7. Submit for Review
8. Apple revisa em 1-3 dias (pode ter rejeições — comum)

### Fase P.7 — Atualizações (releases futuros)
```bash
# Bump version
# app.json: "version": "1.0.1"
# iOS: incrementa buildNumber
# Android: incrementa versionCode

eas build --platform all --profile production
eas submit --platform all
```

### Fase P.8 — Marketing / ASO (App Store Optimization)
- Palavras-chave: "pet", "veterinário", "prontuário", "saúde animal", "vacina cachorro"
- Screenshots com texto sobreposto (use Figma)
- Vídeo preview 30s (taxa de conversão +30%)
- Pedidos de review in-app (use `expo-store-review`)

---

## Custos típicos (estimativa)

| Item | Custo |
|---|---|
| Apple Developer | $99/ano |
| Google Play | $25 (uma vez) |
| EAS Build (free tier) | 30 builds/mês grátis; depois $29/mês |
| Domínio + landing page (política privacidade) | ~R$50/ano |
| Backend hosting (mín. produção) | R$50–200/mês |
| **Total ano 1** | ~R$1.500–3.000 |

---

## Checklist final pré-submit

- [ ] App rodando estável em produção (backend deployado)
- [ ] LGPD: política de privacidade publicada e acessível
- [ ] Termos de uso publicados
- [ ] Página de exclusão de conta acessível **sem login** (Apple exige) — ex: `/excluir-conta`
- [ ] Botão de logout claro
- [ ] Builds production com EAS funcionando
- [ ] TestFlight + Internal Testing rodaram com testers reais
- [ ] Screenshots e textos das lojas prontos
- [ ] Privacy policy e suporte como URLs públicas
- [ ] Conta de teste para review (TUTOR + VET) populada com dados
- [ ] Descrição clara que app **não substitui consulta veterinária** (mandatório)

## Decisões pendentes

- [ ] Apple Developer pessoal ou jurídico? (jurídico ajuda na credibilidade clínica)
- [ ] Lançar em quais países? BR primeiro, depois Latam (PT/ES)?
- [ ] Versão web tem que existir antes do mobile, ou podem subir junto?

## Encaixe no roadmap

- **Etapa final** (após Fases 5/6/7 + Spec 01/04 prontas)
- Pré-requisitos:
  - Spec 01 (assinaturas) se app vai ser pago/freemium
  - Spec 04 (IA) se for diferencial principal
  - Spec 02 (mobile cobrança + deleção LGPD) — Apple exige tela "delete account"
