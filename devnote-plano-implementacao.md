# DevNote - Plano de implementacao

App de notas pessoal para desenvolvedores, focado em simplicidade, agilidade de captura e registro rapido do dia a dia.

---

## 1. Visao e principios

**Problema real:** uso IA e resolvo problemas no dia a dia, mas anotacoes ficam espalhadas ou se perdem em ferramentas pesadas e cheias de burocracia.

**Objetivo do app:**
1. Capturar notas rapido, com interface limpa e sem friccao.
2. Salvar pensamentos, comandos, configuracoes e aprendizados em texto livre.
3. Ter busca instantanea e organizacao por tags e notas fixadas.
4. Comecar pelo essencial e so adicionar complexidade quando o nucleo estiver estavel e provado.

**Principios:**
- **Simplicidade radical:** sem formularios rigidos ou excesso de campos obrigatorios;
- **Texto livre primeiro:** anote como pensar (texto livre / markdown simples);
- **Salvar local primeiro, sincronizar depois:** nunca perder uma nota por oscilacao de rede;
- **Cada fase entrega algo 100% usavel.**

---

## 2. Stack Tecnologica

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | React + TypeScript + Vite |
| UI | Tailwind CSS (v3) + shadcn/ui minimalista |
| Estado remoto | TanStack Query |
| Banco local | IndexedDB / localStorage (cache local resiliente) |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Banco central | PostgreSQL (Neon) |
| Validacao | Zod, compartilhado entre front e back (`packages/contracts`) |
| Deploy | Vercel (Frontend Vite + Backend Express Serverless Function) |

---

## 3. Arquitetura

```text
  Frontend (Vite / React)
         |
         v  (HTTP REST /api/v1)
    API Express (Node.js)
         |
         v  (Prisma ORM)
  Neon PostgreSQL (Fonte da Verdade)
```

Regras fixas:
- O frontend nunca acessa o banco de dados diretamente;
- O backend sempre filtra as notas pelo usuario autenticado (`userId`);
- Regra de negocio e validacoes de dados residem no backend / contracts.

---

## 4. Modelo de dados essencial

**User:**
- `id` (UUID)
- `email` (unico)
- `passwordHash` (bcrypt)
- `createdAt`, `updatedAt`

**Note:**
- `id` (UUID ou nanoid)
- `userId` (referencia ao usuario dono)
- `title` (string)
- `content` (string de texto livre / markdown)
- `tags` (array de strings)
- `isPinned` (boolean)
- `createdAt`, `updatedAt`

---

## 5. Endpoints da API (`/api/v1`)

| Metodo | Endpoint | Funcao |
|---|---|---|
| POST | `/api/v1/auth/register` | Cadastro de usuario com confirmacao de senha |
| POST | `/api/v1/auth/login` | Login com emissao de token JWT e cookie HttpOnly |
| POST | `/api/v1/auth/refresh` | Renovacao silenciosa do token de acesso |
| POST | `/api/v1/auth/logout` | Revogacao de sessao |
| GET | `/api/v1/notes` | Listar e pesquisar notas do usuario |
| POST | `/api/v1/notes` | Criar nova anotacao |
| GET | `/api/v1/notes/:id` | Consultar anotacao especifica |
| PUT/PATCH | `/api/v1/notes/:id` | Atualizar titulo, conteudo, tags ou fixacao |
| DELETE | `/api/v1/notes/:id` | Excluir anotacao |

---

## 6. Fases de Evolucao

### Fase 1 - MVP: App de Notas Pessoal Agil (Fase Atual)
- [x] Monorepo pnpm, TypeScript, configs limpas.
- [x] Backend migrado para Node + Express + Prisma + Neon.
- [x] Autenticacao completa (registro, login, refresh, logout, senhas com bcrypt).
- [x] Frontend com design system dark refinado e sem ruido de IA.
- [x] Layout minimalista de 2 colunas (Lista a esquerda, Nota em foco a direita).
- [x] Editor limpo de notas livres (Titulo, Tags, Conteudo livre, Fixar, Excluir).
- [ ] Endpoints de CRUD de notas no backend Express conectados ao Prisma.
- [ ] Conexao do frontend via TanStack Query para sincronizar notas com a API.
- [ ] Deploy completo na Vercel (Web + API).

### Fase 2 - Offline e PWA
- [ ] IndexedDB para cache offline automatico de leitura e escrita.
- [ ] Sincronizacao em segundo plano ao retomar conexao.
- [ ] PWA instalavel no desktop e celular.

### Fase 3 - Especializacao para Devs (Depois)
- [ ] Syntax highlighting opcional para blocos de codigo dentro do Markdown.
- [ ] Visualizacao de cheat sheets / comandos frequentes.
- [ ] Exportacao e importacao em formato Markdown (`.md`).
- [ ] Integracoes externas futuras (IA assistente, Electron desktop se necessario).

### Fase 4 - Android e IA nativa
- [x] App Expo (TypeScript) em `apps/mobile` — scaffold + build validado.
- [x] Auth mobile no backend (`POST /mobile-auth/login`, `/refresh`, `/logout`).
- [x] Login mobile no app (TelaLogin + secure-store + api client).
- [ ] CRUD de notas no mobile usando a API.
- [ ] Integracao com intents do Android.
- [ ] Base para AppFunctions da IA nativa.
- [ ] Ver plano detalhado em `docs/ANDROID_IMPLEMENTATION_PLAN.md`.
