# Criação de Pinia Store

## Convenção de Arquivos

Stores ficam em `src/stores/<entidade>.store.ts` e **devem ser escritas em TypeScript**.

---

## Store Padrão (sem paginação)

```typescript
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface Item {
  id: number;
  descricao: string;
  // adicionar campos conforme o DTO do backend
}

export const useMinhaEntidadeStore = defineStore('minhaEntidade', {
  state: (): Estado<Item> => ({
    lista: [],
    emFoco: null,
    chamadasPendentes: { lista: false, emFoco: false },
    erros: { lista: null, emFoco: null },
  }),

  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;
      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/minha-entidade`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async buscarItem(id: number): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;
      try {
        this.emFoco = await this.requestS.get(`${baseUrl}/minha-entidade/${id}`);
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;
      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/minha-entidade/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/minha-entidade`, params);
        }
        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;
      try {
        await this.requestS.delete(`${baseUrl}/minha-entidade/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro: unknown) {
        this.erros.lista = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
  },

  getters: {
    itensPorId: ({ lista }): Record<number, Item> =>
      lista.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
```

---

## Store com Paginação (MenuPaginacao)

Adicionar `paginacao` ao estado e mapear a resposta da API para as props do `MenuPaginacao` (camelCase):

```typescript
// estado inicial
state: (): EstadoPaginacao<Item> => ({
  lista: [],
  emFoco: null,
  chamadasPendentes: { lista: false, emFoco: false },
  erros: { lista: null, emFoco: null },
  paginacao: {
    paginas: 0,
    paginaCorrente: 0,
    temMais: false,
    tokenPaginacao: null,
    totalRegistros: 0,
  },
}),
```

`buscarTudo` com paginação — mapear snake_case da API para camelCase:

```typescript
async buscarTudo(params = {}): Promise<void> {
  this.chamadasPendentes.lista = true;
  this.erros.lista = null;
  try {
    const {
      linhas,
      paginas,
      pagina_corrente: paginaCorrente,
      tem_mais: temMais,
      token_proxima_pagina: tokenPaginacao,
      total: totalRegistros,
    } = await this.requestS.get(`${baseUrl}/minha-entidade`, params);

    this.lista = linhas;
    this.paginacao = {
      paginas: paginas ?? 0,
      paginaCorrente: paginaCorrente ?? 0,
      temMais: temMais ?? false,
      tokenPaginacao: tokenPaginacao ?? null,
      totalRegistros: totalRegistros ?? 0,
    };
  } catch (erro: unknown) {
    this.erros.lista = erro;
  }
  this.chamadasPendentes.lista = false;
},
```

No componente de lista, usar `watchEffect` (rastreia automaticamente todos os `route.query` acessados dentro de `buscarTudo`):

```typescript
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

watchEffect(() => {
  store.buscarTudo(route.query);
});
```

No template, usar `v-bind="paginacao"` — colocar acima e abaixo da tabela:

```vue
<MenuPaginacao class="mt2 bgb" v-bind="paginacao" />
<SmaeTable :dados="lista" :colunas="[...]" ... />
<MenuPaginacao class="mt2" v-bind="paginacao" />
```

---

## Regra watch vs watchEffect

| Situação | Hook |
|---|---|
| Filtros sem paginação | `watch` com array explícito de `route.query` campos |
| Com `MenuPaginacao` | `watchEffect` (rastreia tudo automaticamente) |

Nunca misturar os dois para o mesmo `buscarTudo`.
