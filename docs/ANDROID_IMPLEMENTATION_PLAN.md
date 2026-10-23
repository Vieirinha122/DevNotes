# DevNote - Plano de Implementacao Android

## 1. Objetivo

Adicionar uma camada Android ao DevNote para permitir:

- criar nota;
- atualizar nota;
- excluir nota;
- fixar e desafixar nota;
- preparar a aplicacao para execucao por IA nativa do Android.

O foco inicial nao e recriar o DevNote inteiro em mobile. O foco e expor as capacidades principais da aplicacao de notas em um app Android fino, seguro e reaproveitando o backend existente.

---

## 2. Direcao de arquitetura

### Decisao principal

Criar um app Android leve em `apps/mobile` usando Expo/TypeScript, com responsabilidade de:

- autenticar o usuario em contexto mobile;
- chamar a API ja existente do DevNote;
- expor intents e, depois, AppFunctions;
- abrir fluxos simples de confirmacao quando necessario.

### O que nao faremos no MVP

- nao vamos mover toda a interface web para Android agora;
- nao vamos embutir um chat de IA dentro do projeto;
- nao vamos duplicar regra de negocio de notas no app mobile;
- nao vamos depender de widget na primeira entrega.

### Reuso do backend atual

O backend atual ja possui base para:

- `POST /api/v1/notes`
- `GET /api/v1/notes/:id`
- `PUT/PATCH /api/v1/notes/:id`
- `DELETE /api/v1/notes/:id`

Tambem ja existe o campo `isPinned`, entao fixar nota deve ser tratado como atualizacao parcial.

---

## 3. Escopo do MVP Android

### Entrega 1 - Base nativa e autenticacao mobile

- [x] criar `apps/mobile` (Expo SDK 53);
- [x] configurar projeto Expo + expo-router + TypeScript;
- [x] definir `applicationId` (`com.devnote.mobile`), deep link `devnote://create`;
- [x] criar cliente HTTP (`api/client.ts` com retry automatico em 401);
- [x] criar fluxo de login mobile (`TelaLogin.tsx` + `auth-store.ts`);
- [x] armazenar sessao de forma segura no dispositivo (`expo-secure-store`);
- [~] validar chamada autenticada para listar e manipular notas;  <!-- login OK; notas validar na Fase C -->

### Entrega 2 - Acoes principais de nota

- criar nota com `title`, `content`, `tags`, `isPinned`;
- atualizar nota existente;
- excluir nota com confirmacao;
- fixar e desafixar nota;
- tratar erros de rede, expiracao de sessao e conflitos simples.

### Entrega 3 - Integracao Android assistiva

- suporte a `NoteIntents` para criar, editar e excluir;
- tela de confirmacao antes de efetivar alteracoes destrutivas;
- deep links internos para abrir rascunhos e notas;
- telemetria minima de sucesso/erro.

### Entrega 4 - Integracao com IA nativa

- implementar AppFunctions para:
  - `createNote`
  - `updateNote`
  - `deleteNote`
  - `setPinned`
- descrever cada funcao com metadata clara;
- exigir confirmacao local para exclusao;
- validar a integracao por `adb`.

---

## 4. Mudancas necessarias no backend

### 4.1 Autenticacao mobile

Hoje o fluxo principal usa cookie `httpOnly` para refresh de browser. Para Android, precisamos de um fluxo proprio, porque a execucao em background nao deve depender do cookie web.

Implementar:

- `POST /api/v1/mobile-auth/login`
- `POST /api/v1/mobile-auth/refresh`
- `POST /api/v1/mobile-auth/logout`

Regras:

- o login retorna `accessToken`, `refreshToken` e dados do usuario;
- o refresh token deve continuar sendo salvo hasheado no banco;
- o app Android armazena o refresh token com armazenamento seguro do sistema;
- cada sessao deve registrar `deviceId` e `platform = android`.

### 4.2 Ajustes de dominio

- permitir atualizar `content`, `title`, `tags` e `isPinned` pela mesma rota atual;
- manter exclusao como soft delete;
- adicionar idempotencia para acoes disparadas por integracao futura com agente, se necessario.

### 4.3 Observabilidade minima

- logar `userId`, `deviceId`, operacao e status;
- diferenciar requests mobile das requests web;
- facilitar debug de execucoes vindas de intents e AppFunctions.

---

## 5. Estrutura sugerida do app Android

```text
apps/android/
  app/
    src/main/
      java/.../auth
      java/.../notes
      java/.../intents
      java/.../appfunctions
      java/.../ui
```

### Modulos logicos

- `auth`: login, refresh, logout, secure storage;
- `notes`: client HTTP, models, use cases;
- `intents`: integracao com NoteIntents e deep links;
- `appfunctions`: funcoes expostas para IA nativa;
- `ui`: telas simples de confirmacao, erro e sucesso.

---

## 6. Fases de implementacao

## Fase A - Fundacao Android

- [x] criar `apps/mobile`;
- [x] configurar projeto Expo SDK 53 + expo-router + TypeScript;
- [x] definir `applicationId` (`com.devnote.mobile`), flavors basicos e variaveis de ambiente;
- [x] criar cliente HTTP (expo-router + fetch, sera completado na Fase B);
- [x] criar fluxo de login mobile;
- [x] armazenar sessao de forma segura no dispositivo;
- [x] validar chamada autenticada para listar e manipular notas;

#### Criterio de aceite (parcial)

- app compila e exporta bundle sem erros;
- tela inicial abre no emulador via Expo Go (SDK 53);
- deep link `devnote://create` configurado.

### Fase B - Sessao mobile

- [x] criar schema de request/response do auth mobile;
- [x] implementar endpoints no backend;
- [x] persistir sessao no Android com armazenamento seguro;
- [x] renovar token silenciosamente;
- [x] invalidar sessao no logout.

#### Criterio de aceite

- usuario consegue autenticar, fechar e reabrir o app mantendo sessao valida;
- token expirado renova sem quebrar a experiencia.

### Fase C - CRUD de notas no Android

- listar notas do usuario;
- criar nota;
- editar nota;
- excluir nota;
- fixar e desafixar nota;
- exibir feedback de erro e sucesso.

#### Criterio de aceite

- todas as operacoes principais funcionam no Android usando a API de producao ou homologacao;
- nota alterada no Android reflete corretamente no web.

### Fase D - Intents do Android

- registrar suporte a criacao de nota;
- registrar suporte a edicao ou append quando viavel;
- confirmar a acao com o usuario antes de salvar;
- abrir a nota correta dentro do app.

#### Criterio de aceite

- sistema Android consegue encaminhar a criacao de nota para o DevNote;
- usuario confirma e a nota e persistida corretamente.

### Fase E - AppFunctions

- implementar `createNote`;
- implementar `updateNote`;
- implementar `deleteNote`;
- implementar `setPinned`;
- testar via `adb shell cmd app_function`.

#### Criterio de aceite

- as funcoes aparecem registradas no dispositivo;
- cada funcao executa o caso feliz;
- exclusao exige confirmacao local.

---

## 7. Ordem tecnica recomendada

1. Criar `apps/android` e fazer o app compilar.
2. Implementar auth mobile no backend.
3. Implementar login e sessao segura no Android.
4. Implementar client de notas e operacoes CRUD.
5. Adicionar fluxo de fixar e desafixar.
6. Adicionar `NoteIntents`.
7. Adicionar `AppFunctions`.
8. Testar em dispositivo real.

---

## 8. Riscos e decisoes importantes

### Risco 1 - Auth atual foi pensado para browser

Sem fluxo mobile proprio, o Android ficara acoplado ao cookie web e isso vai quebrar os casos de background.

### Risco 2 - IA nativa nao deve apagar sem confirmacao

Excluir nota precisa de confirmacao local explicita, mesmo se a chamada vier de agente.

### Risco 3 - Escopo mobile pode crescer cedo demais

Se tentarmos portar toda a UI do web agora, a entrega atrasa. O ideal e comecar pela camada funcional.

### Risco 4 - AppFunctions nao deve ser a primeira dependencia

O app precisa funcionar sozinho antes de depender da integracao com agente.

---

## 9. Backlog tecnico detalhado

### Backend

- criar modulo `mobile-auth`;
- adicionar contratos compartilhados para auth mobile;
- reutilizar service de sessao atual;
- incluir identificacao de plataforma e device;
- testar login, refresh e logout mobile.

### Android

- criar projeto Expo (TypeScript) em `apps/mobile`;
- configurar HTTP client (TanStack Query);
- criar secure storage (expo-secure-store);
- criar repository de notas (Zod shared);
- criar fluxos de create, update, delete e pin;
- criar intents via Expo IntentLauncher + config plugins;
- preparar modular nativo para AppFunctions (eject parcial na Fase E).

### QA

- teste de login invalido;
- teste de token expirado;
- teste de criacao de nota sem rede;
- teste de exclusao com cancelamento;
- teste de nota fixada e desafixada;
- teste de mesma conta em web e Android.

---

## 10. Definicao de pronto

Esta frente estara pronta quando:

- existir um app Android instalavel;
- o usuario conseguir autenticar com sessao propria mobile;
- o app conseguir criar, editar, excluir e fixar notas;
- o Android conseguir receber uma intencao de criar nota;
- a base de AppFunctions estiver pronta para testes locais.

---

## 11. Proximo passo recomendado

Comecar por:

1. [x] scaffold de `apps/mobile` (Expo) — concluído;
2. [x] endpoints de `mobile-auth` no backend — concluído;
3. [ ] primeiro fluxo funcional: login + criar nota.  ← Fase C em andamento
