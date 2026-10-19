# DevNote — Plano de implementação

App de notas pessoal que começa simples e evolui para uma ferramenta de aprendizado de dev, com desktop (Electron), celular, IA interna e integração com assistentes.

---

## 1. Visão e princípios

**Problema real:** uso IA para implementar features e bugs, depois me perco em como foi feito e não consigo refazer sem ela.

**Objetivo do app:**
1. Capturar notas rápido, em qualquer dispositivo, com sync confiável.
2. Guardar o que aprendi: a lógica (Portugol), a solução e o porquê.
3. Servir de cheat sheet pessoal (funções e trechos prontos).
4. Ter uma IA que ajuda a **aprender**, não só a entregar código.

**Princípios**
- Começar pelo app de notas básico; só evoluir depois que o núcleo estiver estável.
- Nunca perder uma nota: salvar local primeiro, sincronizar depois.
- Cada fase termina com algo utilizável.
- Features de aprendizado são notas com estrutura (não um sistema separado).
- Segredos (chaves, tokens) nunca vão para a IA sem aviso.
- Plataformas nativas (widget, assistente) são integrações separadas, não "React universal".

**Validação do hábito:** antes de investir em features de aprendizado (fase 3+), o hábito de registrar o que aprendi já roda via notas automáticas no Obsidian (regra no `GEMINI.md`). Teste de recordação semanal: esconder a solução de uma nota antiga e tentar refazer. Isso valida quais campos do template realmente funcionam antes de virarem features no app.

---

## 2. Template de nota "Resolvi isso" (spec do tipo `solution`)

O app terá um tipo de nota `solution` com esta estrutura de campos:

| Campo | Obrigatório | Preenchido por |
|---|---|---|
| Título | sim | usuário ou IA |
| Problema | sim | usuário ou IA |
| Minha lógica (Portugol) | sim | IA preenche, usuário revisa |
| Solução (código) | sim | IA |
| Por que funciona | sim | **só o usuário** |
| O que eu não sabia | não | IA sugere, usuário confirma |
| Tags | não | usuário |

O campo "Por que funciona" é o mais importante: se o usuário não consegue escrever, ainda não entendeu. A IA nunca preenche esse campo.

O template atual vive no vault do Obsidian (`99-Templates/resolvi-isso.md`) e já é usado antes do app existir.

---

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | React + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Estado remoto | TanStack Query |
| Banco local | IndexedDB + Dexie |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Node.js + Fastify + TypeScript |
| ORM | Prisma |
| Banco central | PostgreSQL (Neon) |
| Validação | Zod, compartilhado entre front e back |
| Testes | Vitest, Supertest, Playwright |
| Deploy | Vercel (Frontend Vite + Backend Fastify adaptado como Serverless) |
| CI/CD | GitHub Actions |
| Desktop (depois) | Electron + electron-updater (GitHub Releases) |
| Android (depois) | Kotlin nativo para widget e integrações; app com Expo/React Native ou nativo (decidir na fase 6) |

---

## 4. Arquitetura

```
 Interfaces:  PWA (web)  ->  Electron (depois)  ->  Android (depois)
                      \          |          /
                       Camada compartilhada
              (contracts Zod, domain, api-client, módulo de sync)
                                 |
                     API Fastify  /api/v1
        auth · notas · tags · sync · IA · (MCP depois)
                                 |
                    PostgreSQL (Neon) — fonte da verdade
   Cliente: IndexedDB — cache local + fila de operações pendentes
```

### Estrutura do repositório

```
devnote/
├── apps/
│   ├── web/                # PWA React + Vite
│   └── api/                # Fastify + Prisma
├── packages/
│   ├── contracts/          # schemas Zod e DTOs
│   ├── domain/             # regras puras (validação, templates)
│   ├── sync/               # lógica de sync independente de UI
│   └── api-client/         # cliente HTTP tipado
├── prisma/
├── docs/
│   ├── architecture.md
│   └── sync-protocol.md
└── pnpm-workspace.yaml
```

`apps/desktop` e `apps/mobile` só são criados quando a fase correspondente começar.

Regras fixas:
- O frontend nunca fala com o banco e nunca guarda segredo de IA.
- A lógica de sync fica em `packages/sync`, nunca dentro de componentes React.
- Toda consulta no backend é filtrada pelo usuário autenticado.

---

## 5. Modelo de dados

**User:** id, email, passwordHash, createdAt, updatedAt

**Note**
- id (UUID gerado no cliente), userId
- title, content (Markdown)
- kind: `note` | `checklist` | `snippet` | `solution`
- metadata (JSON): campos extras por tipo (linguagem, projeto, campos do template). Evita migração pesada ao evoluir.
- isPinned, version, createdAt, updatedAt, deletedAt (exclusão lógica)

**Tag:** id, userId, name, color
**NoteTag:** noteId, tagId
**Session / RefreshToken:** id, userId, hash, expiresAt, revokedAt
**SyncOperation:** operationId, userId, deviceId, entityId, status (idempotência)
**SyncChange:** seq (autoincremento), userId, entityId, changeType (cursor do pull)

Depois: Project/Collection, ReviewSchedule (revisão espaçada), Reminder.

---

## 6. Protocolo de sincronização (resumo)

1. Salvar a nota no IndexedDB e enfileirar a operação.
2. Tentar `POST /sync/push` com o lote de operações.
3. Servidor aplica cada operação de forma idempotente (`operationId`) e responde `applied` ou `conflict` por operação.
4. Cliente chama `GET /sync/pull?cursor=...` para receber mudanças confirmadas (cursor sequencial, não `updatedAt`).
5. Conflito (versão-base desatualizada): **salvar uma cópia "conflito" da nota e avisar**, sem sobrescrever. Tela de merge fica para depois, se necessário.
6. Gatilhos de sync: abrir o app, recuperar conexão, voltar para a aba e após cada alteração (não depender de Background Sync).
7. Estados na interface: Salvo neste dispositivo · Sincronizando · Sincronizado · Conflito.

Cuidados: pedir `navigator.storage.persist()` para reduzir risco de o navegador limpar o IndexedDB, e permitir exportar tudo em `.md`.

---

## 7. API (`/api/v1`)

| Método | Endpoint | Função |
|---|---|---|
| POST | /auth/register, /auth/login, /auth/refresh, /auth/logout | Autenticação |
| GET | /me | Usuário atual |
| GET/POST | /notes | Listar/pesquisar e criar |
| GET/PATCH/DELETE | /notes/:id | Consultar, atualizar, excluir (lógico) |
| GET/POST | /tags | Tags |
| POST | /sync/push | Enviar operações |
| GET | /sync/pull | Receber mudanças |
| POST | /ai/* | IA interna (fase 4) |

---

## 8. Fases

### Fase 1 — MVP: app de notas básico
- [x] Monorepo, TypeScript, lint e CI básico.
- [x] Fastify + Prisma + Neon, migrations.
- [x] Cadastro, login, logout e refresh (bcrypt cost 12 — ADR-001 no vault; plano dizia Argon2id/scrypt mas decisão aprovada foi bcrypt).
- [ ] CRUD de notas em Markdown, com editor e pré-visualização.
- [ ] Tags, notas fixadas, checklists, lixeira recuperável.
- [ ] Autosave com indicador de salvamento.
- [ ] Busca por título, conteúdo e tag (servidor).
- [ ] Layout responsivo com shadcn/ui.
- [ ] Deploy na Vercel: Frontend (Vite) + Backend Fastify adaptado como Serverless Function (entrypoint `api/index.ts` com Neon PostgreSQL).
- [ ] Testes de integração da API.

**Pronto quando:** uso o app no dia a dia, online, no navegador, no PC e no celular.

### Fase 2 — Offline, sync e PWA
- [ ] Manifest, ícones e service worker.
- [ ] IndexedDB (Dexie): notas locais e fila de operações.
- [ ] Busca local (MiniSearch ou índice no Dexie) para funcionar offline.
- [ ] `sync/push` e `sync/pull` com idempotência e cursor.
- [ ] Cópia de conflito e indicadores de estado.
- [ ] Exportar/importar `.md`.
- [ ] Testes de sync: duplicação, retentativa, conflito, dois dispositivos.

**Pronto quando:** crio e edito notas sem internet e elas aparecem nos outros dispositivos depois, sem duplicar nem perder.

### Fase 3 — Modo aprendizado
- [ ] Template "Resolvi isso" com um clique (campos em `metadata`).
- [ ] Tipos `snippet` e `solution`, com syntax highlighting e campo de linguagem.
- [ ] **Cheat sheet:** coleção pessoal de snippets e funções por categoria (arrays, strings, datas, fetch com filtro...), com busca rápida e botão copiar.
- [ ] Filtros por linguagem, tecnologia e projeto.
- [ ] **Modo recordação:** esconder a solução, eu tento refazer e depois comparo.
- [ ] Revisão espaçada simples (lembrar de rever notas antigas).

### Fase 4 — IA interna (tutor)
- [ ] Interface `AIProvider` e um único provedor no início; chave só no servidor.
- [ ] Ações: explicar snippet, resumir nota, transformar nota em checklist.
- [ ] **Ações de tutor:** "me dê uma pista, não a resposta", "me faça 3 perguntas sobre esta nota", "revise minha solução".
- [ ] Detector de segredos antes de enviar conteúdo à IA.
- [ ] Limites de uso e controle de custo.
- [ ] Busca semântica com embeddings (opcional, depois).

### Fase 5 — Desktop (Electron)
- [ ] Empacotar a mesma interface React.
- [ ] Atalho global para abrir/fechar captura rápida.
- [ ] Janela flutuante (always on top) como "widget" desktop: nota fixada ou captura rápida.
- [ ] Atualização automática via GitHub Releases (electron-updater, ou update.electronjs.org se o repositório for público e o alvo for Windows/macOS).
- [ ] GitHub Actions gerando releases por sistema operacional.

### Fase 6 — Servidor MCP
- [ ] Expor operações como ferramentas: `createNote`, `searchNotes`, `getRecentNotes`, `appendToNote`.
- [ ] Autenticação e limites de permissão; sem acesso irrestrito ao banco.
- [ ] Ações destrutivas exigem confirmação.
- [ ] Permite que agentes de código consultem e registrem notas.

### Fase 7 — Android
- [ ] App Android com acesso offline e o mesmo protocolo de sync.
- [ ] Widget de captura rápida (Jetpack Glance, Kotlin) com últimas notas fixadas.
- [ ] Ditado por voz e "compartilhar para o DevNote" a partir de outros apps.
- [ ] **AppFunctions (integração com o Gemini):** implementar as mesmas funções da fase 6 em Kotlin. A documentação oficial indicava, em maio de 2026, a integração com o Gemini em prévia privada para testadores e exigência de Android 16+. **Conferir o status atual antes de investir.**
- [ ] Decidir entre app nativo puro ou Expo/React Native + módulos Kotlin.

### Fase 8 — Depois
- Lembretes, widget de foco, iOS (WidgetKit), anexos, histórico de versões, compartilhamento.

---

## 9. Critérios de aceite do MVP (fases 1 e 2)

- [ ] Crio, edito, pesquiso e excluo notas.
- [ ] Fecho e reabro o app sem perder nada.
- [ ] Crio e edito notas sem internet.
- [ ] Alterações pendentes sincronizam ao voltar a conexão.
- [ ] Repetir uma operação não duplica a nota.
- [ ] Conflito nunca sobrescreve em silêncio.
- [ ] Um usuário não acessa notas de outro.
- [ ] Nenhuma chave de IA no frontend.
- [ ] Consigo instalar a PWA no celular e no PC.
- [ ] Fluxos principais têm testes automatizados.

---

## 10. Riscos e decisões em aberto

- **Sync offline** é a parte mais difícil; reservar mais tempo que para as telas.
- **Escopo:** não começar fases 3 a 7 antes de a fase 2 estar sólida.
- **AppFunctions/Gemini:** depende de acesso do Google; tratar como integração opcional.
- **Segurança:** rate limiting, CORS restrito, HTTPS, logs sem conteúdo de notas, backups do banco.
- **Decidir depois:** app Android nativo puro ou Expo; busca semântica; se o foco em dev vira o produto principal (sinal: a maior parte das minhas notas é técnica).
