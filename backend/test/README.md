# E2E tests (backend)

Fast end-to-end tests: the whole `AppModule` boots per spec file against its own throwaway Postgres
database, and requests go through supertest (no network port). Runner: Node's built-in `node:test`.
Compiler: TypeScript 7 (`tsgo`, ~4s for all of `src/` + `test/`).

## Commands

```bash
npm run test:e2e -- test/orgao/orgao.e2e-spec.ts       # one file
npm run test:e2e -- test/orgao test/ods                # folders (every *.e2e-spec.ts inside)
npm run test:e2e                                       # everything under test/
npm run test:e2e -- test/orgao --test-name-pattern="CRUD"   # filter by test name (use the = form)
npm run typecheck                                      # TS7 typecheck of src/ (~4s), skips src/**/*.spec.ts
npm run typecheck -- --with-tests                      # same, plus test/
```

Run from `backend/`. Never run `node --test` or `jest` on these files directly: the runner sets up the
database, env and module resolution.

Useful env vars: `E2E_LOG=1` (Nest logs + HTTP request log), `E2E_CONCURRENCY=N` (parallel spec
files, default 4), `E2E_KEEP=1` or `--keep` (keep `dist-test/run-<pid>` and the cloned databases for
inspection; they are garbage-collected on a later run), `E2E_REBUILD_BASE=1`, `E2E_PG_URL`.

## How it works (what you can rely on)

1. `tsgo -p tsconfig.e2e.json` compiles `src/`, `test/`, `prisma/seed.ts` and `bin/pgsql-migrate.ts`
   into `dist-test/run-<pid>/` (one dir per run, so concurrent runs never collide). Type errors in the
   spec files you selected (or in `test/lib/`) abort the run; errors in other specs are only a warning.
2. A template database `smae_test_base_<hash>` is built once (prisma migrate deploy, `prisma/manual-copy`
   pgsql, seed) and rebuilt only when migrations, manual-copy, seed or the runner change (~7s).
3. Each spec file runs in its own process. `bootApp()` clones the template
   (`CREATE DATABASE smae_test_run<pid>_... TEMPLATE ...`), points `DATABASE_URL` at it and boots the app
   (~1s). The database is dropped when the run ends. **No cleanup needed in tests**, and no test can
   see data from another file.
4. Crons are disabled (`DISABLED_CRONTABS=all`). External services (S3, SEI, SOF, geo, TransfereGov,
   Gotenberg) point to `http://127.0.0.1:9/`, which refuses connections.
5. The tests never touch `smae_dev`: the runner and `bootApp()` only create/drop databases named
   `smae_test_*`. Server: the one in `DATABASE_URL` of `backend/.env` (or `E2E_PG_URL`). Postgres 12+ works
   (timescale is only referenced by a `.sql` file, which the pgsql runner ignores).

Several agents can run `npm run test:e2e` at the same time on the same machine.

## File layout

Mirror the controller's path under `src/`, one spec per controller file:

| controller | spec |
|---|---|
| `src/orgao/orgao.controller.ts` | `test/orgao/orgao.e2e-spec.ts` |
| `src/casa-civil/demanda/demanda.controller.ts` | `test/casa-civil/demanda/demanda.e2e-spec.ts` |
| `src/pdm/pdm.controller.ts` (2 controllers) | `test/pdm/pdm.e2e-spec.ts` (one top-level `describe` per controller) |

Import helpers with a relative path (`'../lib'`, `'../../lib'`, ...). The file name must end in
`.e2e-spec.ts`.

## Helper API (`test/lib`)

| helper | what it does |
|---|---|
| `bootApp()` | Clones the DB and boots the app. Call `await bootApp()` in the top-level `before()`. Cached per file. |
| `api(sessao?, { sistema? })` | supertest client: `.get/.post/.patch/.put/.delete(path)`. `sessao` is a `Sessao` or a raw token; omit it for anonymous requests. `sistema` sends `smae-sistemas: SMAE,<sistema>` like the frontend. Paths are literal: always start with `/api/`. |
| `assertStatus(res, 201)` | Asserts the HTTP status and prints the response body when it differs. Prefer it over `assert.equal(res.status, ...)`. |
| `assert` | `node:assert` strict mode (`assert.equal`, `assert.deepEqual`, `assert.match`, `assert.ok`, ...). |
| `loginAsSuperAdmin()` | `Sessao` of `superadmin@admin.com` (perfis "Administrador(a) Geral do SMAE" + SYSADMIN). Has almost every `Cadastro*` privilege but **not** the `PDM.*`, `PS.*`, `MDO.*`, `SMAE.*` ones (except `SMAE.superadmin`/`SMAE.sysadmin`). |
| `criarPessoaComPrivilegios(['CadastroOrgao.inserir', ...], { orgao_id? })` | New pessoa with a new perfil containing exactly those privileges. Returns `Sessao` `{ pessoa: { id, email, nome_exibicao, orgao_id }, token }`. Unknown codes fail immediately. Default orgao: 1 (from the seed). |
| `criarPessoaSemPrivilegios()` | Authenticated pessoa that passes no `@Roles`: use it for 403 tests. |
| `prisma()` | The app's `PrismaService`, to arrange data or assert on the database. |
| `uniq(prefix?)` | Unique string (`"prefix <pid>-<n>-<hex>"`). Use it for every name/sigla/descricao/titulo. |
| `criarTipoOrgao()`, `criarOrgao({ tipo_orgao_id?, parente_id?, nivel? })` | Direct inserts through Prisma. |
| `criarPlanoSetorial({ sistema?: 'PlanoSetorial' \| 'ProgramaDeMetas', dados? })` | Creates a Plano Setorial (or, with `ProgramaDeMetas`, a new-style PDM) through the API as superadmin. Returns the response body (`id`, `nome`, ...). |
| `criarPdmAntigo(dados?)` | Creates a legacy PDM through `POST /api/pdm` (sistema `PDM`). |

Add new factories to `test/lib/factories.ts` only when several modules need the same prerequisite;
otherwise create the data inside your spec (through the API, or with `prisma()`).

## Worked example

```ts
import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
    uniq,
} from '../lib';

describe('tipo-orgao', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTipoOrgao.inserir',
            'CadastroTipoOrgao.editar',
            'CadastroTipoOrgao.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    it('401 sem token', async () => {
        assertStatus(await api().post('/api/tipo-orgao').send({ descricao: uniq() }), 401);
    });

    it('403 sem CadastroTipoOrgao.inserir', async () => {
        const res = await api(semPrivilegio).post('/api/tipo-orgao').send({ descricao: uniq() });
        assertStatus(res, 403);
        assert.match(res.body.message, /CadastroTipoOrgao\.inserir/);
    });

    it('400 com descricao vazia', async () => {
        assertStatus(await api(gestor).post('/api/tipo-orgao').send({ descricao: '' }), 400);
    });

    it('cria, lista, edita e remove', async () => {
        const descricao = uniq('Autarquia');
        const criado = await api(gestor).post('/api/tipo-orgao').send({ descricao });
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const lista = await api(gestor).get('/api/tipo-orgao');
        assert.deepEqual(
            lista.body.linhas.find((l: { id: number }) => l.id === id),
            { id, descricao }
        );

        assertStatus(await api(gestor).patch(`/api/tipo-orgao/${id}`).send({ descricao: uniq() }), 200);
        assertStatus(await api(gestor).delete(`/api/tipo-orgao/${id}`), 202);
    });

    it('400 ao remover tipo com órgão ativo', async () => {
        const tipo = await api(gestor).post('/api/tipo-orgao').send({ descricao: uniq() });
        await criarOrgao({ tipo_orgao_id: tipo.body.id });
        assertStatus(await api(gestor).delete(`/api/tipo-orgao/${tipo.body.id}`), 400);
    });
});
```

More references: `test/tipo-orgao/`, `test/orgao/` (validation, hierarchy, soft delete checked with
`prisma()`), `test/ods/` (privilege that depends on the `smae-sistemas` header).

## Reading a controller

- **Path**: `/api/` + `@Controller('x')` + the method decorator (`@Get(':id')`, `@Patch('foo/:id')`).
  `@Controller('')` means the method path is the full path (`/api/minha-conta`). Some controllers take an
  array (`@Controller(['projeto-mdo/proxy', 'auxiliar/proxy'])`): test one of them.
- **Status codes**: `@Post` returns 201 and the rest 200, unless there is `@HttpCode(...)`
  (`HttpStatus.ACCEPTED` = 202, `NO_CONTENT` = 204). Read the decorator, do not guess.
- **Privileges**: `@Roles([...])` on the method (or on the class). The user needs **any one** of the
  listed codes. No `@Roles` means any logged-in user. `@IsPublic()` means no token needed. Many services
  check more privileges inside (`user.hasSomeRoles([...])`, `ForbiddenException`); read the service
  method too. The codes are typed (`ListaDePrivilegios`), so a typo is a compile error.
- **`smae-sistemas` header** (`api(s, { sistema: 'PlanoSetorial' })`):
  - Each privilege belongs to a module, and each module to one or more sistemas (`ModuloDescricao` at the
    top of `prisma/seed.ts`). With a header, the session only keeps privileges of `SMAE` + that sistema,
    and `PessoaService.filtraPrivilegiosSMAE` strips a few more (e.g. `CadastroOds.*` outside
    PDM/PlanoSetorial/ProgramaDeMetas). Without a header, every privilege is kept.
  - Code that calls `user.assertOneModuloSistema(...)` (about 30 places) **requires** a header and
    answers 400 without it ("foi enviando mais de um sistema").
  - `@TipoPDM()` (plano-setorial, meta, iniciativa, indicador, tema, cronograma... routes) reads the header too: no header
    means `PlanoSetorial`, `ProgramaDeMetas` means new-style PDM, anything else is 400. Legacy `pdm`
    routes use `PDM`.
  - Sistemas: `PDM`, `PlanoSetorial`, `ProgramaDeMetas`, `Projetos`, `MDO`, `CasaCivil`.
- **Body/query**: DTO classes in `dto/`. The global `ValidationPipe` has `whitelist: true` and
  `transform: true`: unknown fields are dropped silently, and `:id` that is not a number gives 400.
  Validation errors come back as `{ statusCode: 400, message: string[] }`.

## Pitfalls

- Import test functions from `node:test` (`describe`, `it`, `before`, `after`), and `assert` from
  `../lib`. There are no jest globals: no `expect`, no `beforeAll`.
- **Never** use a default import of a CommonJS package (`import request from 'supertest'`,
  `import moment from 'moment'`, `import assert from 'node:assert'`): at runtime it is `undefined`
  (the build keeps the production `esModuleInterop: false` semantics). Use `import { x } from '...'`,
  or `import x = require('...')`. You should not need supertest directly: use `api()`.
- A pessoa with **zero** privileges gets **400** "Seu usuário não tem mais permissões", not 403. Use
  `criarPessoaSemPrivilegios()` for 403. Same thing if the header filters out all of a pessoa's
  privileges.
- `loginAsSuperAdmin()` is not "can do everything": it lacks `PDM.*`/`PS.*`/`MDO.*` privileges and
  workflow rules (orgao, equipe, responsável) still apply. For permission rules, prefer
  `criarPessoaComPrivilegios([...])` with exactly the `@Roles` codes.
- On errors, responses for the superadmin carry an extra `exception` field with the stack trace. Assert on
  `res.body.message`, not on the whole body.
- The database is not empty: the seed creates orgao 1, tipo_orgao 1, the superadmin, a bot user, perfis,
  privileges, eleições, etc. Never assert list lengths or "first row"; find your row by id.
- All tests in a file share one database and run in order. Create what each test needs (with `uniq()`)
  instead of depending on another test, unless the steps are one CRUD flow inside a single `it`.
- Many services reject duplicates with an `endsWith`/`ILIKE` check on `descricao`/`sigla`/`nome`: always
  use `uniq()` for those fields.
- Endpoints that call S3/upload, SEI, SOF, geo/geocoding, TransfereGov, Gotenberg/PDF, or reports that
  depend on them, fail with 500 here. Test their validation/permission paths only, and say so in a
  comment.
- Do not change files in `src/` to make a test pass. If you find a bug, keep the test asserting the
  correct behavior and mark it `it('...', { todo: 'BUG: <what is wrong>' }, async () => { ... })`: it
  still runs and prints, but does not fail the suite. Report it.
- `POST /api/orgao` without `parente_id` picks an arbitrary orgao as parent and fails with "Nível (undefined)
  inválido": send `parente_id: null` for a root orgao (`criarOrgao()` inserts through Prisma and is not affected).
- The dev Postgres has `max_connections = 100`, shared by every agent. On "too many clients", lower
  `E2E_CONCURRENCY`.
- Default timeout is 120s per test. A hanging test usually means an external call; see above.
- In a git worktree, `node_modules` and `.env` are missing: `ln -s <main checkout>/backend/node_modules`
  and `cp <main checkout>/backend/.env` into the worktree's `backend/`. The symlinked Prisma client matches
  the main checkout's `schema.prisma`; a branch that changes the schema needs its own `npx prisma generate`.
