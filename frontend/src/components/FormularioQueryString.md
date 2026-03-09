# FormularioQueryString

Componente headless (renderless) que sincroniza o estado de um formulário de filtros com os parâmetros da URL (_query string_). Toda a lógica de leitura/escrita da URL fica encapsulada aqui, deixando o template filho livre para definir a aparência.

## Uso básico

```vue
<FormularioQueryString v-slot="{ aplicarQueryStrings, detectarMudancas, formularioSujo, pendente }">
  <form :aria-busy="pendente" @submit.prevent="aplicarQueryStrings">
    <input name="titulo" type="text" @change="detectarMudancas" />
    <button type="submit" :disabled="!formularioSujo">Filtrar</button>
  </form>
</FormularioQueryString>
```

## Props

| Prop               | Tipo      | Padrão  | Descrição                                                                                                                                                    |
|--------------------|-----------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `valoresIniciais`  | `Object`  | `{}`    | Valores padrão para os campos. Na montagem, são mesclados com a query atual (a query da URL tem precedência). Também servem de fallback quando um campo é limpo. |
| `naoNormalizarUrl` | `boolean` | `false` | Desativa a normalização da URL na montagem. Útil quando o componente é usado dentro de um contexto que não deve alterar o histórico de navegação (ex.: modais). |

## Eventos

| Evento    | Payload                              | Quando é emitido                                                                       |
|-----------|--------------------------------------|----------------------------------------------------------------------------------------|
| `montado` | `Record<string, unknown>` — query resultante | Logo após a montagem, depois de mesclar `valoresIniciais` com a query atual e atualizar a URL. |
| `aplicado`| `UrlParams` — query resultante       | Após cada aplicação bem-sucedida de filtros via `aplicarQueryStrings`.                |

## Slot padrão (scoped)

Todos os filhos recebem as seguintes propriedades via slot:

| Propriedade          | Tipo         | Descrição                                                                                                              |
|----------------------|--------------|------------------------------------------------------------------------------------------------------------------------|
| `aplicarQueryStrings` | `Function`  | Aplica os filtros na URL. Aceita um `SubmitEvent` (lê o `FormData`) ou um objeto chave/valor. Após aplicar, chama `router.replace()`, emite `aplicado` e recalcula `formularioSujo`. |
| `limpar`             | `Function`   | Reseta os filtros. Sem argumentos, reseta os campos declarados em `valoresIniciais`. Aceita um array de nomes de campos para resetar apenas um subconjunto: `limpar(['titulo', 'status'])`. |
| `detectarMudancas`   | `Function`   | Notifica o componente que um campo mudou. Aceita um `Event` DOM (usa `event.target.name` e `event.target.value`) ou um objeto chave/valor. Atualiza `formularioSujo` e `camposSujos`. |
| `formularioSujo`     | `boolean`    | `true` enquanto houver pelo menos um campo cujo valor difere do que está na query da URL atual.                       |
| `camposSujos`        | `string[]`   | Lista dos nomes dos campos que diferem da query atual. Útil para realce visual por campo.                             |
| `pendente`           | `boolean`    | `true` enquanto `router.replace()` estiver em andamento.                                                              |

## Comportamentos automáticos

- **Inicialização:** na montagem, mescla `valoresIniciais` com `route.query` (a URL tem precedência), ordena as chaves alfabeticamente e chama `router.replace()` para normalizar a URL — exceto quando `naoNormalizarUrl` está ativo.
- **Limpeza de valores vazios:** strings vazias são removidas da query ao aplicar os filtros.
- **Ordenação de chaves:** os parâmetros são sempre gravados na URL em ordem alfabética.
- **Comparação com coerção de tipos:** a detecção de mudanças usa `decodificadorDePrimitivas` para comparar valores independentemente de tipo (`"true"` === `true`, `"42"` === `42`, etc.), evitando falsos positivos causados pela serialização da query string.
- **Suporte a arrays:** se o mesmo `name` aparecer em múltiplos campos de um formulário HTML, os valores são acumulados em um array na query.

## Exemplos

### Com `SubmitEvent` (formulário HTML nativo)

O `aplicarQueryStrings` aceita diretamente o evento de submit. Os campos são lidos via `FormData`.

```vue
<FormularioQueryString
  :valores-iniciais="{ status: 'ativo' }"
  @aplicado="recarregarLista"
  @montado="recarregarLista"
>
  <template #default="{ aplicarQueryStrings, formularioSujo, pendente }">
    <form :aria-busy="pendente" @submit.prevent="aplicarQueryStrings">
      <select name="status">
        <option value="ativo">Ativo</option>
        <option value="inativo">Inativo</option>
      </select>
      <button type="submit" :class="{ dirty: formularioSujo }">Filtrar</button>
    </form>
  </template>
</FormularioQueryString>
```

### Com objeto (programático)

Útil quando o formulário é controlado por uma biblioteca de formulários (ex.: vee-validate) que fornece os valores validados como objeto.

```vue
<FormularioQueryString v-slot="{ aplicarQueryStrings, pendente }">
  <form :aria-busy="pendente" @submit.prevent="onSubmit(aplicarQueryStrings)">
    <!-- campos gerenciados por vee-validate -->
  </form>
</FormularioQueryString>
```

```js
const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  await aplicarQueryStrings(valoresControlados);
});
```

### Detectando mudanças em campos individuais

```vue
<FormularioQueryString v-slot="{ aplicarQueryStrings, detectarMudancas, formularioSujo, camposSujos }">
  <div :class="{ 'filtros-desatualizados': formularioSujo }">
    <input
      name="busca"
      :class="{ 'campo-modificado': camposSujos.includes('busca') }"
      @input="detectarMudancas"
    />
    <button @click="aplicarQueryStrings({ busca: buscaAtual })">Aplicar</button>
  </div>
</FormularioQueryString>
```

### Botão "Limpar filtros"

```vue
<FormularioQueryString
  :valores-iniciais="{ status: 'ativo' }"
  v-slot="{ aplicarQueryStrings, limpar, formularioSujo, pendente }"
>
  <form :aria-busy="pendente" @submit.prevent="aplicarQueryStrings">
    <select name="status">…</select>
    <input name="titulo" type="text" />

    <button type="submit">Filtrar</button>
    <button type="button" :disabled="!formularioSujo" @click="limpar()">
      Limpar filtros
    </button>
  </form>
</FormularioQueryString>
```

Para limpar apenas campos específicos sem alterar os demais:

```js
limpar(['titulo', 'status'])
```

## Uso em componentes de alto nível

O componente `FiltroParaPagina.vue` encapsula `FormularioQueryString` e o combina com vee-validate para oferecer uma solução declarativa de filtros com validação de schema. Considere usar `FiltroParaPagina` quando os campos do filtro forem simples (texto, select, checkbox, autocomplete) e exigirem validação.

Use `FormularioQueryString` diretamente quando precisar de controle total sobre o template ou quando a lógica de formulário já for gerenciada externamente.
