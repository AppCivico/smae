<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Descrição

O backend está escrito em [Nest](https://github.com/nestjs/nest), que é um framework TypeScript, junto com Prisma (ORM) também para typescript.

## Primeiro passo: instalar as deps

```bash
$ npm install --save-dev
```

Criar as classes geradas a partir do ORM:

```bash
$ npx prisma generate
```

## Configurar variáveis de ambiente


```bash
$ cp .env.example .env
```

Editar arquivo `.env` de acordo com a configuração.

> caso `npm run start:dev` não carregar o arquivo .env automaticamente, exportar antes de subir o comando


## Subindo em modo Dev

```bash
# development
$ npm run start

# watch mode < recomendado
$ npm run start:dev

# production mode
$ npm run start:prod
```



## License

SMAE é produzido com licença [AGPL](../LICENSE)
