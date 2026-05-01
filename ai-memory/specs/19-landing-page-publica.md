# Spec 19 — Landing Page Pública (`/`)

> **Status:** salvo, não iniciado. Rodar quando o Ali pedir.
> **Persona:** Front-end Sênior + Designer de produto + Copywriter SaaS.
> **Origem:** pedido do Ali em 2026-05-01: "uma página web pública que
> escreve sobre o projeto e como pode usar e sobre os planos assinatura
> e nesta página ter cadastrar/login e falar que já existe app para
> mobile e benefício de ser membro neste sistema".

---

## Contexto

Hoje:
- `/` redireciona para `/login` ou para a área autenticada (`HomeRedirect`
  em `App.tsx`)
- Não existe **homepage pública** descrevendo o produto
- Visitante novo não vê nada antes de criar conta — barreira de adoção

Decisão durável a tomar com Ali: **`/` vira landing pública**;
autenticados são redirecionados para `/tutor`/`/vet`/`/admin` (já existe
o `HomeRedirect`, mas hoje ele só redireciona — vamos trocar para
landing pública quando user não autenticado).

## Escopo

Página única (one-pager) em **`pages/Landing.tsx`** com seções abaixo,
totalmente i18n-ready (`t("landing.*")`) nos 6 idiomas oficiais.

### 1. Hero (acima da dobra)
- Logo grande (`/logo-512.png`)
- Tagline curto: "O prontuário do seu pet, na palma da mão"
  (chave: `landing.hero.tagline`)
- Subtítulo: 1-2 linhas explicando o que o produto faz
- 2 CTAs: **"Cadastrar grátis"** (→ `/register`) e
  **"Já tenho conta"** (→ `/login`)
- Selo discreto: "Disponível também no app mobile" com ícones
  iOS/Android (links pra App Store / Play Store quando publicado;
  por enquanto pode ser texto + emoji)
- **Espaço de imagem hero**: à direita (desktop) ou abaixo (mobile),
  mockup do app + foto de um pet feliz (composição). Asset:
  `/landing/hero.webp` — placeholder até Ali subir o real.

### 2. Como funciona (3 passos)
Seção com cards lado a lado (responsivo):
1. **Cadastre seu pet** — nome, espécie, raça, peso
2. **Registre o histórico clínico** — vacinas, exames, prescrições,
   anexos
3. **Compartilhe com o veterinário** — gere PIN temporário, ele acessa
   o prontuário direto pelo navegador
Cada card: ícone + título + 2 linhas + **screenshot pequeno** do app
fazendo aquela ação. Assets:
- `/landing/step-1-add-pet.webp`
- `/landing/step-2-record.webp`
- `/landing/step-3-share-pin.webp`

### 3. Para tutores e veterinários
Lado a lado:
- **Tutores**: pets ilimitados, lembretes de vacina, anexos, IA pra
  ler receitas, família compartilhada
- **Veterinários**: portal próprio, acesso via PIN, histórico
  completo, sem cadastro complicado

### 4. Planos de assinatura
Tabela/cards comparando **FREE** vs **PRO**:

| Recurso | Free | PRO |
|---|---|---|
| Pets cadastrados | 1 | Ilimitados |
| Histórico clínico | ✓ | ✓ |
| Anexos por registro | até 3 | Ilimitados |
| OCR de receitas (IA) | ❌ | ✓ |
| Transcrição de áudio | ❌ | ✓ |
| Resumo inteligente do prontuário | ❌ | ✓ |
| Co-tutores (família) | ❌ | ✓ |
| Suporte | comunidade | prioritário |
| Preço | Grátis | R$ 14,90/mês |

CTA: "Começar grátis →" (vira `/register`).

> **Importante**: descrição alinhada com `subscription.benefit_*` do
> `pt-BR.json` (fonte de verdade). Ao alterar a tabela, alterar o JSON
> também.

### 5. App mobile
Banner: "Também disponível no celular".
- Print mockado (asset opcional `landing-mobile-mockup.png` — pode
  pedir ao Ali)
- Botões iOS/Android com fallback "Em breve" se ainda não publicado
- Texto: "Mesma conta, mesmos dados, sincronizados em tempo real"

### 6. Benefícios de ser membro
Lista visual (ícones grandes):
- 🩺 Acesso direto pelo veterinário
- 🔔 Lembretes automáticos de vacinação
- 👨‍👩‍👧 Família compartilha o cuidado
- 🌐 Disponível em 6 idiomas
- 🔒 LGPD/GDPR — você controla seus dados
- ⚡ Sincronização web + mobile em tempo real

### 6.5. Antes vs Depois (pain points → solução)
Seção comparativa em 2 colunas mostrando o impacto na vida do tutor:

**Sem o PetDiary** (coluna esquerda, tom problema):
- 📁 "Onde está aquele cartão de vacina?" — folha amassada na gaveta
- ⏰ "Quando foi a última vermifugação?" — você não lembra
- 🏥 Vet pede o histórico — você manda foto borrada do que achou
- 👫 Quem mora com você não sabe quando o pet tomou remédio
- 📞 Liga pro vet pra perguntar a dose que ele te receitou semana passada
- ✈️ Viaja e o cuidador não tem ideia das alergias do pet

**Com o PetDiary** (coluna direita, tom solução):
- 📱 Tudo em um lugar, organizado por data e tipo
- 🔔 Lembrete automático de vacina, retorno, antiparasitário
- 🩺 Vet acessa o prontuário completo com um PIN temporário
- 👨‍👩‍👧 Familiares compartilham o cuidado com login próprio
- 💊 Foto da receita virou texto pesquisável (IA do PRO)
- 🌍 Acesso de qualquer lugar, web ou app

Cada linha tem **ícone + texto curto**. Visual emocional: a coluna
esquerda em tons cinzas, direita em verde/teal da marca.

### 6.6. Histórias reais (testimonials)
3 cards (com foto + nome + cidade) — começam com depoimentos fictícios
realistas, viram reais conforme o produto cresce. Exemplos para copy
inicial:

> **Ana, tutora da Mel (gata, 4 anos) — São Paulo**
> "Antes eu vivia procurando carteirinha de vacina. Agora abro o app e
> mostro tudo pro vet em 5 segundos. A IA leu uma receita que eu nem
> conseguia decifrar."

> **Dr. Pedro, veterinário — Belo Horizonte**
> "Atendo 30 pets por dia. Quando o tutor chega com o PIN, eu já vejo
> tudo: vacinas, alergias, exames antigos. Economiza 10 minutos de
> consulta e evita repetir exame caro."

> **Carla, dividida entre 2 cidades**
> "Meu pai cuida do Thor durante a semana. Como ele tem login de
> familiar, eu vejo no domingo o que aconteceu sem ligar perguntando.
> Plano PRO da minha conta cobre os dois."

Layout: 3 cards lado a lado (desktop) ou carrossel (mobile). Cada um:
- Foto do tutor + pet (asset `/landing/testimonial-{1,2,3}.webp`)
- Nome em negrito + papel/cidade
- Citação em itálico
- Estrela ⭐⭐⭐⭐⭐ discreta no canto

> Ali decide depois se vai pegar fotos reais com clientes (com
> autorização) ou usar ilustrações estilizadas. Por enquanto:
> placeholder com avatar + iniciais.

### 6.7. Galeria de screenshots / fotos
Carrossel ou grid responsivo com prints reais do app + fotos
contextuais. Sugestões:
- App tutor mostrando timeline cheia
- Modal "PIN gerado!" com 6 dígitos
- Tela do veterinário acessando prontuário
- Pet sendo fotografado (mão segurando celular tirando foto da receita)
- Família reunida olhando o app
- Lembrete de vacina chegando como notificação push

Assets em `petDiary-frontend-web/public/landing/gallery/` com
nomes `01.webp`, `02.webp`, etc. Placeholder até Ali subir reais
(ai-memory `IMAGENS-DO-PROJETO.md` será atualizado com a lista
final).

### 7. FAQ pública
4-6 perguntas mais frequentes (subset do HelpCenter mobile, mesmas
chaves `help.faq_q1..7`/`help.faq_a1..7` do JSON).

### 8. Footer
- Email de contato
- Link Termos de uso (`/termos`) — placeholder
- Link Política de privacidade (`/privacidade`) — placeholder
- Idiomas: LanguageSwitcher discreto
- Copyright + versão

---

## Implementação técnica

### Roteamento (`App.tsx`)
- Trocar `<Route path="/" element={<HomeRedirect />} />` por:
  ```tsx
  <Route path="/" element={
    <PublicHomeOrRedirect />
  } />
  ```
- `PublicHomeOrRedirect`: se autenticado → redireciona como hoje;
  se não → renderiza `<Landing />`
- Loops de redirect: cuidar que `/login` e `/register` continuem
  acessíveis

### Layout
- Tailwind 4 (já em uso)
- Componente único `pages/Landing.tsx` com seções como sub-components
  privados (não exportar)
- Acima da dobra: hero + 1 CTA primário visível em mobile
- Sticky header com logo + 2 botões (Login / Cadastrar) + LanguageSwitcher

### i18n (decisão durável Ali, 2026-05-01)
A landing **deve** estar em multi-idioma desde o primeiro dia:

1. **Detecção automática pelo navegador**: o `i18next-browser-languagedetector`
   já está configurado em `i18n/index.ts` web. Ordem de detecção atual:
   `localStorage` → `navigator`. Confirmar que funciona na rota pública
   (sem auth, sem cookie, sem `localStorage` na 1ª visita → cai no
   `navigator.language` → mapeia para um dos 6 supportedLngs ou
   fallback pt-BR).
2. **Seletor manual visível**: `<LanguageSwitcher />` no header sticky
   da landing (mesmo componente já usado nas outras telas) e no footer.
   Idioma escolhido pelo user grava em `localStorage` (chave
   `petdiary-language` — já configurada).
3. **6 idiomas obrigatórios** (regra `project_idiomas_petdiary.md`):
   pt-BR, pt-PT, en, es, fr, ar. **Árabe usa RTL** — o `applyDir()`
   já vira `<html dir="rtl">` automaticamente.
4. Adicionar namespace `landing.*` no `pt-BR.json` web (~80 chaves) e
   **replicar manualmente nos outros 5 locales** com tradução real.
   Não usar Google Translate em copy de marketing — copy ruim afasta
   visitante.
5. Mapeamentos do detector (cobrir variações regionais comuns):
   - `pt`, `pt-PT` → `pt-PT`
   - `pt-BR`, `pt-pt-br` → `pt-BR` (default)
   - `en-*` → `en`
   - `es-*` → `es`
   - `fr-*` → `fr`
   - `ar-*` → `ar`

### SEO
- `<title>PetDiary — Prontuário inteligente para o seu pet</title>`
- `<meta name="description" content="...">`
- Open Graph: `og:title`, `og:description`, `og:image=/logo-512.png`
- Twitter Card
- `<link rel="canonical" href="https://petdiary.com.br/">`

### Performance
- Lazy load do `<Landing />` (ele tem mais HTML mas não roda em
  usuários autenticados — `React.lazy` + Suspense)
- Imagens com `loading="lazy"` exceto a do hero
- Sem fontes externas pesadas (Nunito já é carregada)

### Acessibilidade
- Headings hierárquicos (`<h1>` único, depois `<h2>` por seção)
- Alt em todas as imagens
- Botões com texto descritivo (não só ícone)
- Contraste verificado com a paleta da marca

---

## Aceite (testes manuais)

- [ ] Anônimo abre `https://app.petdiary.com.br/` → vê Landing, não
      redireciona para `/login`
- [ ] User autenticado abre `/` → redireciona para `/tutor`/`/vet`/`/admin`
- [ ] Botões "Cadastrar grátis" levam para `/register`
- [ ] Botões "Já tenho conta" levam para `/login`
- [ ] Anônimo com `navigator.language=fr-FR` abre `/` → vê landing em
      francês automaticamente (sem clique)
- [ ] Anônimo com `navigator.language=ar-SA` → vê landing em árabe E
      layout flippado (RTL)
- [ ] LanguageSwitcher na Landing troca para os 6 idiomas; persiste
      em `localStorage` (próxima visita lembra)
- [ ] Lighthouse Performance ≥ 90 mobile e desktop
- [ ] Cards de FREE vs PRO refletem `subscription.benefit_*` do JSON
- [ ] FAQ abre/fecha com accordion (reusa pattern do HelpCenter)
- [ ] Mobile: hero ocupa viewport, CTAs visíveis sem rolar

---

## Pendências dependentes

- **App stores**: links iOS/Android só funcionam após publicação
  (PENDENCIAS-HUMANAS itens 11 e 12)
- **Termos/privacidade**: páginas placeholder `/termos` e `/privacidade`
  até documento real (PENDENCIAS-HUMANAS item 13)
- **Domínio público**: precisa de `petdiary.com.br` apontando
  (PENDENCIAS-HUMANAS itens 1-3)

## Notas

- Mobile NÃO precisa replicar a Landing — é UX nativa diferente. Mas a
  primeira tela do app já é o Login (que tem o logo). Talvez adicionar
  um onboarding deslizável de 3 telas no mobile depois (Spec separada).
- O backend NÃO precisa de mudanças — Landing é puro frontend público.
- Após implementar, atualizar `ai-memory/PARIDADE-MOBILE-WEB.md` para
  registrar que web ganhou Landing (mobile não tem equivalente).
