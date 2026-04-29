# SMAE - Frontend

Este modelo deve ajudá-lo a começar a desenvolver com o Vue 3 no Vite.

## Configuração de IDE recomendada

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (e desativar Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Personalizar configuração

Ver [Vite Configuration Reference](https://vitejs.dev/config/).

## Configuração do projeto

```sh
npm install
```

### Compilar e atualizar para desenvolvimento

```sh
npm run dev
```

### Compilar e Minificar para Produção

```sh
npm run build
```

### Lint com [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Git Hooks (Husky)

Husky is configured to run git hooks from the `frontend/.husky/` directory. Because the git repository root is one level up, the `prepare` script must be run from inside the `frontend/` folder — it navigates to the repo root (`cd ..`) before initialising husky.

### Installation

`npm install` triggers the `prepare` script automatically (`cd .. && husky frontend/.husky`), which registers the hooks with git. No extra steps are needed.

If you need to re-register the hooks manually (e.g. after cloning without running install):

```sh
npm run prepare
```

### Configured hooks

| Hook | What it does |
|------|-------------|
| `pre-commit` | Runs `lint-staged` — fixes ESLint issues on staged `*.vue`, `*.js`, `*.ts`, and related files before each commit. |
| `pre-push` | Runs `vitest` (`npx vitest run --project front`) before pushing **only** when the target branch is `master` or `homol`. Pushes to other branches skip the test run. |

### Node.js not found in hook PATH (nvm / fnm users)

Git hooks run with a minimal PATH that does not source your shell profile, so Node.js installed via a version manager will not be found. Husky v9 automatically loads `~/.config/husky/init.sh` before every hook — create it once per machine:

**nvm**
```sh
mkdir -p ~/.config/husky
cat >> ~/.config/husky/init.sh << 'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --no-use
EOF
```

**fnm**
```sh
mkdir -p ~/.config/husky
echo 'eval "$(fnm env)"' >> ~/.config/husky/init.sh
```

This file is personal and should not be committed to the repository.

### Dependencies

| Package | Version |
|---------|---------|
| `husky` | `^9.1.6` |
| `lint-staged` | `^15.2.10` |
