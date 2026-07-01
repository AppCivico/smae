# SmaeCNPJCampo

Campo de entrada de CNPJ com máscara visual via [Maska](https://beholdr.github.io/maska/).
O valor exibido é sempre formatado (`00.000.000/0000-00`), mas o valor
emitido/armazenado é sempre limpo — apenas os 14 dígitos, sem pontuação.

## Características

- Máscara aplicada com a diretiva `v-maska` e a classe `Mask` do Maska
- Caracteres que não são dígitos são descartados automaticamente
- Compatível com os três modos de uso do [SmaeText](../SmaeText/SmaeText.vue):
  autônomo (via `useField` interno), `Field` v-slot e `v-model`
- Suporta `anularVazio`/`v-model.anular` para emitir `null` em vez de `''`

## Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `name` | `String` | obrigatório | Nome do campo (registro no VeeValidate) |
| `modelValue` | `String` | `undefined` | Valor limpo (somente dígitos) para os modos `Field`/`v-model` |
| `modelModifiers` | `Object` | `{}` | Modificadores do `v-model` (ex.: `.anular`) |
| `anularVazio` | `Boolean` | `false` | Emite `null` em vez de `''` quando o campo é limpo |

## Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `update:modelValue` | `string \| null` | Emitido com o valor limpo (sem máscara) a cada alteração |

## Padrão de Uso

### Modo autônomo (padrão)

```vue
<SmaeCNPJCampo
  name="cnpj"
  class="inputtext light mb1"
  :schema="schema"
/>
```

### Modo `Field` v-slot

```vue
<Field
  v-slot="{ value, handleChange }"
  name="cnpj"
>
  <SmaeCNPJCampo
    name="cnpj"
    class="inputtext light mb1"
    :model-value="value"
    @update:model-value="handleChange"
  />
</Field>
```

### Modo `v-model`

```vue
<SmaeCNPJCampo
  name="cnpj"
  class="inputtext light mb1"
  v-model="cnpj"
/>
```

## Como funciona a máscara

A formatação exibida (`valorExibido`) é recalculada a partir do valor limpo
usando a própria classe `Mask` do Maska (`mascara.masked(valorAtual)`), então
ela fica sempre sincronizada tanto quando o usuário digita quanto quando o
valor muda externamente (ex.: `setFieldValue`, reset de formulário).

Ao digitar, a diretiva `v-maska` dispara o evento nativo `maska` com um
`detail` contendo `{ masked, unmasked, completed }`. O componente usa apenas
`detail.unmasked` como valor real — é isso que garante que o dado enviado ao
backend nunca contenha pontuação, mesmo que o `<input>` mostre a máscara.
