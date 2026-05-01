# 📱 Publicação no Apple App Store + Google Play

> Guia completo para publicar o app mobile do **petDiary** (Expo / React Native) nas duas lojas. Inclui checklist LGPD/Apple, custos, e troubleshooting.

---

## 💰 Custos (resumo)

| Item | Valor | Periodicidade |
|---|---|---|
| Apple Developer Program | **$99 USD** | anual |
| Google Play Developer | **$25 USD** | uma vez (vitalício) |
| EAS Build (Expo) | grátis até 30 builds/mês; $29 USD/mês depois | mensal |
| Domínio + página de privacidade | ~R$50 | anual |
| **Total ano 1 (mín.)** | **~R$1.500–3.000** | — |

---

## ✅ Pré-requisitos

### Contas
1. **Apple Developer Account** — https://developer.apple.com (verificar com cartão de crédito; 1-2 dias de aprovação)
2. **Google Play Console** — https://play.google.com/console
3. **Conta Expo** — https://expo.dev (gratuita; necessária para EAS Build)
4. **Conta empresarial** (recomendado): Nubank PJ + CNPJ para receber pagamentos

### Documentação obrigatória (ambas as lojas)
- ✅ **Política de Privacidade** publicada em URL pública estável (LGPD-compliant)
- ✅ **Termos de Uso**
- ✅ **Email de suporte** (obrigatório pela Apple)
- ✅ **Página "Excluir minha conta"** acessível **sem login** (exigência Apple desde 2022)
- ✅ **Categorização**: Saúde e Forma Física → Animais
- ✅ **Classificação etária**: Livre 4+ ou 13+ se houver feed social

### Conformidade
- **LGPD** (Brasil): Spec 01 + Spec 02 — política de privacidade, exportação/exclusão de dados, anonimização (já planejado em `DELETE /users/me/`)
- **GDPR** (Europa): mesma diretriz se publicar lá
- **App Review Guidelines** (Apple): apps com features médicas precisam de aviso "**Este app não substitui consulta veterinária profissional**"
- **Sensitive Permissions** (Google): câmera/microfone/galeria precisam de justificativa por escrito

---

## 🛠 Preparação técnica

### 1. Atualizar `app.json`
```json
{
  "expo": {
    "name": "PetDiary",
    "slug": "petdiary",
    "version": "1.0.0",
    "runtimeVersion": { "policy": "appVersion" },
    "ios": {
      "bundleIdentifier": "com.petdiary.mobile",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "PetDiary precisa da câmera para fotografar receitas, exames e documentos do seu pet.",
        "NSMicrophoneUsageDescription": "Para gravar áudio de sintomas e diário falado do pet.",
        "NSPhotoLibraryUsageDescription": "Acessar fotos existentes para anexar ao prontuário do pet."
      }
    },
    "android": {
      "package": "com.petdiary.mobile",
      "versionCode": 1,
      "permissions": ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F3F5F8"
      }
    }
  }
}
```

A cada release, **incrementar**: `version` (semver), `ios.buildNumber`, `android.versionCode`.

### 2. Configurar EAS Build
```bash
npm install -g eas-cli
cd petDiary-frontend-mobile
eas login
eas build:configure
```

Crie/edite `eas.json`:
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
        "appleId": "seu@email.com",
        "ascAppId": "<APP_STORE_CONNECT_ID>",
        "appleTeamId": "<TEAM_ID>"
      }
    }
  }
}
```

### 3. Builds locais para testar
```bash
# Android APK (testers internos)
eas build --platform android --profile preview

# iOS para simulador
eas build --platform ios --profile preview
```

Resultado: link de download do APK e do `.app` para teste local.

---

## 🧪 Beta Testing

### Android — Internal Testing
```bash
eas build --platform android --profile production
eas submit --platform android --track internal
```

No Play Console:
1. Production → Internal Testing → Testers → adicionar emails
2. Testers recebem link e instalam direto

### iOS — TestFlight
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

- Apple processa o build em ~30 min
- App Store Connect → TestFlight → Testers → adicionar
- Testers recebem convite via app TestFlight (gratuito)

### Boas práticas
- **Mínimo 1-2 semanas de beta** com 5-10 testers
- Crashlytics ou Sentry para tracking de erros (Spec 11)
- Form de feedback in-app (Spec 03 — Central de Ajuda)
- Versão de produção nunca é a primeira instalada na loja

---

## 🚀 Submissão final

### Android — Produção

1. Play Console → Production → **Create release**
2. Upload do `.aab` (vem do EAS)
3. Preencher:
   - **Título** (50 caracteres): "PetDiary — Prontuário do Pet"
   - **Descrição curta** (80 caracteres): "Prontuário médico do seu pet, sempre no seu bolso."
   - **Descrição completa** (4000 caracteres): com benefícios, features, palavras-chave
   - **Screenshots**: mín. 2 por dispositivo (telefone + tablet 7" + 10")
   - **Ícone** alta resolução: 512×512 PNG
   - **Banner** feature graphic: 1024×500
4. **Content rating**: questionário; selecionar "Saúde/Animais"
5. **Privacy policy URL**: link público
6. **Data safety declaration**: descrever quais dados o app coleta (LGPD)
7. **Target audience**: 4+ se for clínico apenas; 13+ se houver social
8. **Submeter para revisão** (1-3 dias úteis em média)

### iOS — App Store

1. App Store Connect → My Apps → **+** → New App
   - Bundle ID, Primary Language (Portuguese (Brazil)), Name (até 30 chars)
2. **App Information**:
   - Category: **Health & Fitness**
   - Subcategory: Medical (se passar review como app médico)
3. **Pricing**: Free ou Free with In-App Purchases
4. **Versão 1.0**:
   - **What's New**: release notes
   - **Screenshots** (4 tamanhos): iPhone 6.7", 6.5", 5.5", iPad Pro 12.9"
   - **App Preview** (vídeo 30s — opcional mas aumenta conversão +30%)
   - **Description** (até 4000 chars)
   - **Keywords** (separados por vírgula, sem espaços)
   - **Support URL** (página de ajuda pública)
   - **Marketing URL** (opcional)
5. **App Review Information**:
   - **Conta de teste** (TUTOR + VET) com credenciais funcionando
   - **Notas para o reviewer**: explicar fluxo de PIN ("Tutor gera PIN no app, vet usa no portal web em http://...")
6. **App Privacy**: declarar dados coletados (similar ao Google Data Safety)
7. **Submit for Review** — Apple revisa em 24-72h, mas pode rejeitar (razões comuns abaixo)

---

## ⚠️ Rejeições comuns na Apple (e como evitar)

| Razão | Como prevenir |
|---|---|
| Faltando "delete account" sem login | Página `/excluir-conta` acessível sem autenticação |
| App não substitui consulta veterinária | Aviso explícito na descrição e splash/onboarding |
| Login com senha temporária sem rotação | Forçar troca de senha no 1º login (Spec 5.5 já implementa) |
| Dados pessoais sem política | Privacy policy URL acessível 24/7 |
| Crash ao abrir | Beta exhaustivo no TestFlight |
| Conteúdo de baixa qualidade nas screenshots | Use Figma com texto sobreposto, mockups em iPhone real |

---

## 📦 Atualizações futuras

```bash
# Bump version
# app.json: "version": "1.0.1"
# Incrementa iOS.buildNumber e Android.versionCode

eas build --platform all --profile production
eas submit --platform all
```

Para releases que não mudam código nativo (só JS), pode usar **OTA updates** via `expo-updates` (instantâneo, sem precisar passar por revisão).

---

## ✅ Checklist final pré-submit

- [ ] Backend deployado em produção (URL HTTPS estável)
- [ ] Política de privacidade pública e atualizada (LGPD)
- [ ] Termos de uso publicados
- [ ] Página `/excluir-conta` sem login (Apple obrigatório)
- [ ] Botão de logout claro no app
- [ ] Builds production com EAS funcionando
- [ ] TestFlight + Internal Testing rodaram com testers reais
- [ ] Screenshots e textos das lojas prontos
- [ ] Suporte URL pública e responsiva
- [ ] Conta de teste para review (TUTOR + VET) populada
- [ ] Aviso "não substitui consulta veterinária" visível
- [ ] LGPD: endpoint de exportação/exclusão funciona

---

## 📚 ASO (App Store Optimization)

- **Palavras-chave (Apple, separadas por vírgula)**: pet, veterinario, prontuario, vacina, cachorro, gato, saude animal, prontuario digital
- **Screenshots com texto sobreposto** (Figma/Canva): "Histórico completo do seu pet", "Compartilhe com o vet em 1 clique"
- **Vídeo preview 30s**: tour pelas 3-4 telas principais
- **Reviews** in-app: usar `expo-store-review` para pedir avaliação após 5+ uses
- **Localização**: começar BR; depois Latam (es), depois EN/FR/AR

---

## 🔗 Recursos

- **Apple HIG**: https://developer.apple.com/design/human-interface-guidelines/
- **Material Design** (Android): https://m3.material.io/
- **Expo Docs**: https://docs.expo.dev/build/introduction/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Play Console Help**: https://support.google.com/googleplay/android-developer/

---

## 🆘 Contato em caso de rejeição

Se Apple ou Google rejeitarem:
1. Leia o motivo com atenção (eles dão guia específico)
2. Corrija no código
3. Ajuste descrição/screenshots se for guideline
4. Resubmit (não conta como nova app)
5. Apple permite **Reply to App Review** com explicação técnica
