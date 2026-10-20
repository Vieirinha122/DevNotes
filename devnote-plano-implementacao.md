# DevNote — Plano de implementação

App de notas pessoal para desenvolvedores, focado em simplicidade, agilidade de captura e registro rápido do dia a dia.

---

## 1. Visão e princípios

**Problema real:** uso IA e resolvo problemas no dia a dia, mas anotações ficam espalhadas ou se perdem em ferramentas pesadas e cheias de burocracia.

**Objetivo do app:**
1. Capturar notas rápido, com interface limpa e sem fricção.
2. Salvar pensamentos, comandos, configurações e aprendizados em texto livre.
3. Ter busca instantânea e organização por tags e notas fixadas.
4. Começar pelo essencial e só adicionar complexidade quando o núcleo estiver estável e provado.

**Princípios:**
- **Simplicidade radical:** sem formulários rígidos ou excesso de campos obrigatórios;
- **Texto livre primeiro:** anote como pensar (texto livre / markdown simples);
- **Salvar local primeiro, sincronizar depois:** nunca perder uma nota por oscilação de rede;
- **Cada fase entrega algo 100% usável.**

---

## 2. Stack Tecnológica

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
| Validação | Zod, compartilhado entre front e back (`packages/contracts`) |
| Deploy | Vercel (Frontend Vite + Backend Express Serverless Function) |

---

## 3. Arquitetura

```
  Frontend (Vite / React)
         │
         ▼  (HTTP REST /api/v1)
    API Express (Node.js)
         │
         ▼  (Prisma ORM)
  Neon PostgreSQL (Fonte da Verdade)
```

Regras fixas:
- O frontend nunca acessa o banco de dados diretamente;
- O backend sempre filtra as notas pelo usuário autenticado (`userId`);
- Regra de negócio e validações de dados residem no backend / contracts.

---

## 4. Modelo de dados essencial

**User:**
- `id` (UUID)
- `email` (único)
- `passwordHash` (bcrypt)
- `createdAt`, `updatedAt`

**Note:**
- `id` (UUID ou nanoid)
- `userId` (referência ao usuário dono)
- `title` (string)
- `content` (string de texto livre / markdown)
- `tags` (array de strings)
- `isPinned` (boolean)
- `createdAt`, `updatedAt`

---

## 5. Endpoints da API (`/api/v1`)

| Método | Endpoint | Função |
|---|---|---|
| POST | `/api/v1/auth/register` | Cadastro de usuário com confirmação de senha |
| POST | `/api/v1/auth/login` | Login com emissão de token JWT e cookie HttpOnly |
| POST | `/api/v1/auth/refresh` | Renovação silenciosa do token de acesso |
| POST | `/api/v1/auth/logout` | Revogação de sessão |
| GET | `/api/v1/notes` | Listar e pesquisar notas do usuário |
| POST | `/api/v1/notes` | Criar nova anotação |
| GET | `/api/v1/notes/:id` | Consultar anotação específica |
| PUT/PATCH | `/api/v1/notes/:id` | Atualizar título, conteúdo, tags ou fixação |
| DELETE | `/api/v1/notes/:id` | Excluir anotação |

---

## 6. Fases de Evolução

### Fase 1 — MVP: App de Notas Pessoal Ágil (Fase Atual)
- [x] Monorepo pnpm, TypeScript, configs limpas.
- [x] Backend migrado para Node + Express + Prisma + Neon.
- [x] Autenticação completa (registro, login, refresh, logout, senhas com bcrypt).
- [x] Frontend com design system dark refinado e sem ruído de IA.
- [x] Layout minimalista de 2 colunas (Lista à esquerda, Nota em foco à direita).
- [x] Editor limpo de notas livres (Título, Tags, Conteúdo livre, Fixar, Excluir).
- [ ] Endpoints de CRUD de notas no backend Express conectados ao Prisma.
- [ ] Conexão do frontend via TanStack Query para sincronizar notas com a API.
- [ ] Deploy completo na Vercel (Web + API).

### Fase 2 — Offline e PWA
- [ ] IndexedDB para cache offline automático de leitura e escrita.
- [ ] Sincronização em segundo plano ao retomar conexão.
- [ ] PWA instalável no desktop e celular.

### Fase 3 — Especialização para Devs (Depois)
- [ ] Syntax highlighting opcional para blocos de código dentro do Markdown.
- [ ] Visualização de cheat sheets / comandos frequentes.
- [ ] Exportação e importação em formato Markdown (`.md`).
- [ ] Integrações externas futuras (IA assistente, Electron desktop se necessário).
