# 01 — Conceito do petDiary

## O que é

Plataforma unificada para resolver a **fragmentação dos dados de saúde dos animais de estimação**.

Nasce como **Prontuário Médico Inteligente**, com IA para facilitar entrada de dados, e evolui para uma **Rede Social Nichada e Segura** focada em pets.

## Dor que resolve

Hoje, o histórico médico do pet está disperso entre:
- Cadernetas de papel
- WhatsApp do veterinário
- Pastas de exames físicos
- Memória do tutor

Quando troca de clínica ou muda de cidade — o histórico se perde. Diagnósticos importantes ficam sem contexto.

## Dois usuários, duas jornadas

| Usuário | Plataforma | Necessidade |
|---|---|---|
| **Tutor** | App mobile (Expo) | Conveniência: foto de receita, áudio de sintomas, lembrete de vacina, histórico no bolso |
| **Veterinário** | Portal web (React) | Densidade de dados: insere PIN temporário do tutor e vê linha do tempo clínica completa |

## Mecanismo central: PIN de Acesso Único

- Tutor gera **PIN de 6 dígitos** com prazo de validade
- Vet entra no portal web, digita o PIN, ganha acesso ao prontuário do pet
- Acesso pode ser **revogado** pelo tutor a qualquer momento
- **Privacidade por design**: vet só vê o pet liberado, e só pelo tempo definido

## Roadmap — 3 Fases

### Fase 1 — MVP Clínico (FOCO ATUAL)
- **Objetivo:** criar hábito no tutor resolvendo a dor de perda de histórico
- **Entregáveis:** App mobile (tutor) + Portal web (vet) + PIN de acesso único
- **IA aplicada:** OCR para receitas antigas + Speech-to-Text para diário falado de sintomas

### Fase 2 — Automação e Filtros de Segurança
- **Objetivo:** sistema proativo + preparar terreno para rede social
- **Entregáveis:** alertas automáticos de vacinas/vermífugos por idade/raça
- **IA aplicada:** visão computacional para bloquear fotos onde humanos são o foco

### Fase 3 — Expansão Social
- **Objetivo:** transformar tutores engajados em comunidade ativa
- **Entregáveis:** perfis públicos dos pets, feed de fotos/vídeos curtos, likes, comentários (com tradução automática)
- **IA aplicada:** moderação rigorosa em tempo real

## Princípios

- **Mitigar risco antes de escalar:** cada fase só começa quando a anterior valida engajamento
- **Privacidade primeiro:** PIN temporário, soft-delete, controle total do tutor
- **i18n desde o dia 1:** pt-br, en, es já nos models e nas APIs
