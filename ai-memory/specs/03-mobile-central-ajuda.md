# Spec 03 — Mobile: Central de Ajuda e Suporte

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Depende de:** endpoint `POST /api/v1/support/tickets/` da Spec 01.

---

## Prompt original

> Você é um Desenvolvedor Mobile Sênior (React Native / Expo) especialista em Customer Success (UX).
> Vamos implementar o módulo de "Central de Ajuda e Suporte" no aplicativo "PetDiary".
>
> Crie a estrutura para a tela `HelpCenterScreen` com as seguintes funcionalidades:
>
> 1. **FAQ Rápido (Acordeão/Accordion):**
>    - Mostre as 3 dúvidas mais comuns (ex: "Como compartilho o prontuário com meu veterinário?", "Como cancelar minha assinatura?").
>
> 2. **Formulário de Contato Direto:**
>    - Um dropdown/picker para escolher o motivo do contato: ["Dúvida de Uso", "Reclamação/Problema", "Ideia de Melhoria"].
>    - Um campo de texto grande para a descrição.
>    - Um botão "Enviar Mensagem" que aciona o POST `/api/v1/support/tickets/`.
>
> 3. **Feedback de Sucesso:**
>    - Ao enviar, mostre um modal amigável confirmando que a equipe recebeu a mensagem e informando o prazo de resposta (ex: "Responderemos em até 24h").
>
> Escreva o código priorizando a clareza da interface, utilizando cores calmas e transmitindo confiança para o usuário que precisa de ajuda.

---

## Plano de fases sugerido (a confirmar quando rodar)

### Fase 10.1 — Tela `HelpCenterScreen`
- Path: `src/screens/HelpCenterScreen.tsx`
- Header amigável: "Como podemos ajudar?" + ilustração suave (mascote do PetDiary)
- Cores calmas: usar `colors.brand.teal` como primário, `colors.bg.surface` como cards
- Sem vermelho/amarelo (só pra erros pontuais)

### Fase 10.2 — Componente `<FAQAccordion>`
- Reusable, recebe `items: { question, answer }[]`
- Animação de altura suave com `react-native-reanimated`
- Ícone chevron rotaciona 180° ao expandir
- 3 itens iniciais (mockados em const local pra começar):
  1. "Como compartilho o prontuário com meu veterinário?"
  2. "Como cancelar minha assinatura?"
  3. "Como adicionar um familiar na conta?"
- Futuro: buscar dinâmicos de `/help/faq/` no backend

### Fase 10.3 — Formulário de Contato
- Dropdown nativo `<Picker>` ou bottom sheet com opções:
  - "💬 Dúvida de Uso" (HELP)
  - "⚠️ Reclamação / Problema" (COMPLAINT)
  - "💡 Ideia de Melhoria" (IDEA)
- TextArea (`<TextInput multiline>` mín. 6 linhas) com placeholder "Descreva sua mensagem com detalhes…"
- Contador de caracteres no canto (ex: 245/2000)
- Validação: mín. 20 caracteres pra evitar lixo

### Fase 10.4 — Submit
- `POST /api/v1/support/tickets/` com `{ category, subject (auto), message }`
- Loading state no botão (spinner inline + texto "Enviando…")
- Erros: toast inline pra erro de rede / validação
- Sucesso: abre modal `<SuccessModal>`

### Fase 10.5 — `<SuccessModal>` amigável
- Ícone alegre ✅ ou 🎉
- Título: "Mensagem recebida!"
- Texto: "Nossa equipe vai responder em até 24 horas no e-mail cadastrado: <email>"
- Botão "Ok, entendi" que fecha e volta pra tela
- Sem botão de "X" no canto (forçar leitura — mas com tap fora pra fechar como fallback)

### Fase 10.6 — Histórico de tickets (opcional, depende da Spec 01)
- Se backend tiver `GET /support/tickets/`, adicionar aba/seção mostrando tickets enviados com status (OPEN, IN_PROGRESS, RESOLVED)
- Tap no ticket → tela de detalhe com a conversa (se backend implementar threading)

### Fase 10.7 — Polimento
- Tela acessível via:
  - Drawer/Settings → "Ajuda e Suporte"
  - Footer das telas com link discreto
- Atalho: shake do device abre tela de feedback (`expo-sensors`) — opcional

---

## Princípios de UX (do prompt)

- **Cores calmas** — paleta brand-teal e tons cinza-azulados (já no `theme`)
- **Botões grandes** — mín. 56pt height
- **Texto claro** — fontes 16pt+, linha 24+
- **Confiança** — copy "Estamos aqui pra ajudar", "Receberemos sua mensagem", "Responderemos em até 24h"
- **Sem jargão técnico** — não dizer "abrir ticket", dizer "enviar mensagem"

## Web equivalente

O **web** também precisa de Central de Ajuda. Considerar Spec equivalente para web ou adaptar essa.

## Decisões pendentes

- [ ] FAQ é estático (frontend mockado) ou vem do backend?
- [ ] Email de contato direto também (mailto:) como fallback?
- [ ] Chat ao vivo (Crisp, Intercom) como evolução futura?
- [ ] Tickets têm threading (cliente vê resposta) ou é one-way (cliente envia, equipe responde por email)?
