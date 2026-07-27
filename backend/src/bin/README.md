## Extensões do DuckDB

A lista de extensões vive em **`tools/install-duckdb-extensions.js`**, que é JS puro e é a
única fonte. Para adicionar uma extensão, edite `EXTENSIONS` lá e rode:

    $ npm run duckdb:extensions

Não existe mais etapa de build/cópia. Antes havia um `src/bin/install-duckdb-extensions.ts`
compilado e copiado à mão para `tools/` (`cp dist/src/bin/... tools/`), e foi exatamente isso
que quebrou: o `.ts` ganhou o segundo binding (`@duckdb/node-api`) e a extensão `spatial`, a
cópia em `tools/` nunca foi regerada, e o Dockerfile — que roda a cópia, porque nesse ponto do
build `dist/` ainda não existe — seguiu instalando só `duckdb-async`. O pós-processamento de
relatório ficou sem a extensão `excel` na imagem.

Dois cuidados que o script tem que manter:

- **os dois bindings.** `duckdb-async` e `@duckdb/node-api` estão em versões diferentes de
  DuckDB, e o cache é por versão (`$HOME/.duckdb/extensions/v<versão>/<plataforma>/`).
  Instalar por um só deixa o runtime do outro sem extensão.
- **o usuário certo.** O cache é resolvido por `$HOME`, então instalar como root deixa tudo
  em `/root/.duckdb`, invisível para a API, que roda como `node`. O Dockerfile faz
  `USER node` antes desse `RUN` por isso. O script loga o `HOME` que está usando.
