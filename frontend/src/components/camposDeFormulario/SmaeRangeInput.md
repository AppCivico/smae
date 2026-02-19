# Documentação do Componente SmaeRangeInput

## Visão Geral

`SmaeRangeInput` é um componente de entrada dupla de intervalo (dual range slider) que permite aos usuários selecionar valores mínimos e máximos dentro de um range específico. O componente integra-se com VeeValidate para validação de formulários e oferece opções de formatação monetária, inputs de texto editáveis e sincronização bidirecional.

## Props

### `nameMin` (obrigatória)

- **Tipo:** `string`
- **Descrição:** Nome do campo para o valor mínimo. Usado pelo VeeValidate para gerenciar o estado do campo.

### `nameMax` (obrigatória)

- **Tipo:** `string`
- **Descrição:** Nome do campo para o valor máximo. Usado pelo VeeValidate para gerenciar o estado do campo.

### `min`

- **Tipo:** `number`
- **Padrão:** `0`
- **Descrição:** Valor mínimo permitido para o range.

### `max`

- **Tipo:** `number`
- **Padrão:** `100`
- **Descrição:** Valor máximo permitido para o range.

### `step`

- **Tipo:** `number | null`
- **Padrão:** `null`
- **Descrição:** Incremento dos valores. Se `null`, usa `0.01` como padrão para permitir valores decimais precisos.

### `formatarMoeda`

- **Tipo:** `boolean`
- **Padrão:** `true`
- **Descrição:** Quando `true`, formata os valores como moeda brasileira (R$). Quando `false`, exibe valores numéricos simples.

### `precision`

- **Tipo:** `number`
- **Padrão:** `3`
- **Descrição:** Número de casas decimais para cálculos internos de posicionamento dos sliders. Não afeta a exibição dos valores.

### `mostrarInputs`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Descrição:** Quando `true`, exibe campos de texto editáveis abaixo dos sliders para entrada manual de valores. Quando `false`, exibe apenas labels formatados.

## Como Usar

### Exemplo Básico

```vue
<template>
  <form>
    <label>Faixa de Preço</label>
    <SmaeRangeInput
      name-min="preco_min"
      name-max="preco_max"
      :min="0"
      :max="10000"
    />
  </form>
</template>

<script setup>
import SmaeRangeInput from '@/components/camposDeFormulario/SmaeRangeInput.vue';
</script>
```

### Exemplo com Inputs Editáveis

```vue
<SmaeRangeInput
  name-min="valor_min"
  name-max="valor_max"
  :min="0"
  :max="100000"
  :mostrar-inputs="true"
/>
```

Permite que o usuário ajuste os valores tanto pelos sliders quanto digitando diretamente nos campos de texto.

### Exemplo sem Formatação Monetária

```vue
<SmaeRangeInput
  name-min="quantidade_min"
  name-max="quantidade_max"
  :min="0"
  :max="1000"
  :formatar-moeda="false"
/>
```

Exibe valores numéricos simples sem o símbolo R$ e formatação de moeda.

### Exemplo com Step Customizado

```vue
<SmaeRangeInput
  name-min="peso_min"
  name-max="peso_max"
  :min="0"
  :max="500"
  :step="0.5"
  :formatar-moeda="false"
/>
```

Define incrementos de 0.5 para ajustes mais precisos.

### Integração com VeeValidate e Yup

```vue
<template>
  <Form @submit="onSubmit" :validation-schema="schema">
    <SmaeRangeInput
      name-min="valor_min"
      name-max="valor_max"
      :min="0"
      :max="10000"
      :mostrar-inputs="true"
    />
    <button type="submit">Filtrar</button>
  </Form>
</template>

<script setup>
import { Form } from 'vee-validate';
import * as Yup from 'yup';

const schema = Yup.object({
  valor_min: Yup.number().min(0).required(),
  valor_max: Yup.number().max(10000).required(),
});

function onSubmit(values) {
  console.log('Valores:', values.valor_min, values.valor_max);
}
</script>
```

### Exemplo com FormularioQueryString

```vue
<template>
  <FormularioQueryString
    v-slot="{ aplicarQueryStrings }"
    :valores-iniciais="{}"
  >
    <form @submit.prevent="aplicarQueryStrings">
      <SmaeRangeInput
        name-min="preco_min"
        name-max="preco_max"
        :min="0"
        :max="50000"
        :mostrar-inputs="true"
      />
      <button type="submit">Pesquisar</button>
    </form>
  </FormularioQueryString>
</template>
```

Os valores dos sliders serão automaticamente incluídos nos query parameters da URL.

## Comportamento

### Sincronização Bidirecional

1. **Sliders → VeeValidate:** Quando o usuário move os sliders, os valores são atualizados no VeeValidate automaticamente
2. **VeeValidate → Sliders:** Se os valores forem alterados externamente (ex: via `setFieldValue`), os sliders se ajustam
3. **Inputs de Texto ↔ Sliders:** Quando `mostrarInputs` está ativo, edições nos inputs atualizam os sliders e vice-versa

### Prevenção de Colisão dos Thumbs

O componente usa algoritmo inteligente para evitar que os thumbs (controles deslizantes) se sobreponham:

- Quando o slider mínimo se aproxima do máximo, o ponto médio é calculado usando `Math.ceil`
- Quando o slider máximo se aproxima do mínimo, o ponto médio é calculado usando `Math.floor`
- Isso cria uma separação mínima entre os thumbs

### Gradiente de Preenchimento

O componente exibe um gradiente visual que indica o range selecionado:

- Parte cinza clara: valores fora do range selecionado
- Parte colorida: valores dentro do range selecionado
- O gradiente é calculado dinamicamente com compensação do tamanho do thumb para precisão visual

### Formatação de Valores

#### Com `formatarMoeda={true}` (padrão):

- **Labels/Inputs:** `R$ 1.234,56` (formato brasileiro)
- **Inputs editáveis:** Aceita entrada com vírgula como separador decimal
- **Validação:** Converte automaticamente formato brasileiro para número

#### Com `formatarMoeda={false}`:

- **Labels/Inputs:** `1234.56` (número simples)
- **Inputs editáveis:** Aceita apenas números e ponto decimal

### Inputs Ocultos para Formulários

O componente sempre renderiza inputs `hidden` com os valores atuais:

```html
<input type="hidden" name="valor_min" value="1000">
<input type="hidden" name="valor_max" value="5000">
```

Isso garante que os valores sejam submetidos com o formulário, mesmo quando os sliders não estão visíveis.

## Acessibilidade

### Labels ARIA

O componente usa labels ARIA contextuais para melhor experiência com leitores de tela:

#### Quando `mostrarInputs={false}`:
- Slider mínimo: `aria-label="Valor mínimo"`
- Slider máximo: `aria-label="Valor máximo"`

#### Quando `mostrarInputs={true}`:
- Slider mínimo: `aria-label="Slider valor mínimo"`
- Slider máximo: `aria-label="Slider valor máximo"`
- Input mínimo: `aria-label="Valor mínimo"`
- Input máximo: `aria-label="Valor máximo"`

A diferenciação evita confusão quando múltiplos controles estão visíveis simultaneamente.

### Navegação por Teclado

- **Setas ←/→:** Ajusta o valor do slider em foco pelo `step` definido
- **Setas ↑/↓:** Ajusta o valor do slider em foco pelo `step` definido
- **PageUp/PageDown:** Ajusta o valor em incrementos maiores (10× `step`)
- **Home:** Define o valor como `min`
- **End:** Define o valor como `max`
- **Tab:** Move o foco entre controles

## Integração com Helpers

### Helper `dinheiro`

Usado para formatação de valores monetários:

```javascript
import dinheiro from '@/helpers/dinheiro';

// Formatação para exibição
dinheiro(1234.56, { style: 'currency', currency: 'BRL' });
// Retorna: "R$ 1.234,56"

// Formatação para inputs editáveis
dinheiro(1234.56, { style: 'decimal' });
// Retorna: "1.234,56"
```

### Helper `toFloat`

Usado para converter strings para números, suportando formato brasileiro:

```javascript
import toFloat from '@/helpers/toFloat';

toFloat('1.234,56'); // 1234.56
toFloat('1234.56');  // 1234.56
toFloat('R$ 1.234,56'); // 1234.56
```

## Estilização

O componente usa variáveis CSS customizadas para estilização dinâmica:

```css
.smae-range-input {
  --thumb-width: 20px;
  --track-height: 4px;
  --gradient-position: calc(50% + (0 * var(--thumb-width)));
}
```

### Classes Disponíveis

- `.smae-range-input`: Container principal
- `.range-wrapper`: Wrapper dos sliders com flexbox
- `.range-input`: Input range individual
- `.range-labels`: Container para labels quando `mostrarInputs={false}`
- `.range-inputs`: Container para inputs editáveis quando `mostrarInputs={true}`
- `.input-prefix`: Prefixo "R$" nos inputs editáveis

## Notas Técnicas

### Precisão Decimal

- O componente usa `step={0.01}` por padrão para suportar valores monetários com centavos
- Para evitar problemas de arredondamento com ponto flutuante, todos os cálculos internos usam a `precision` configurável
- Valores são sempre arredondados para o `step` mais próximo

### Flexbox Layout

O componente usa flexbox ao invés de `position: absolute` para posicionamento dos sliders:

```css
.range-input:first-child {
  flex-basis: calc(50% + var(--thumb-width));
}

.range-input:last-child {
  flex-basis: calc(50% + var(--thumb-width));
}
```

Isso garante:
- Layout responsivo sem cálculos JavaScript complexos
- Melhor performance de renderização
- Menos bugs de posicionamento

### Z-Index Dinâmico

O slider em foco recebe `z-index: 2` para aparecer acima do outro, facilitando interações em ranges pequenos.

## Limitações Conhecidas

### Navegadores Antigos

- Requer suporte a `<input type="range">` (IE 10+)
- Usa CSS Grid e Flexbox (IE 11+ com prefixos)
- Usa `Math.min/Math.max` extensivamente

### Safari

- A estilização de `<input type="range">` pode ter pequenas diferenças visuais
- Thumbs podem ter tamanho ligeiramente diferente

### Performance

- Em ranges muito grandes (ex: `min=0, max=1000000`), a sensibilidade do slider pode ser reduzida
- Recomenda-se usar `step` apropriado para a escala dos valores

## Exemplos de Casos de Uso

### Filtro de Preços em E-commerce

```vue
<SmaeRangeInput
  name-min="preco_min"
  name-max="preco_max"
  :min="0"
  :max="10000"
  :mostrar-inputs="true"
/>
```

### Filtro de Área (m²) em Imóveis

```vue
<SmaeRangeInput
  name-min="area_min"
  name-max="area_max"
  :min="20"
  :max="500"
  :step="5"
  :formatar-moeda="false"
/>
```

### Filtro de Salário em Vagas

```vue
<SmaeRangeInput
  name-min="salario_min"
  name-max="salario_max"
  :min="1320"
  :max="50000"
  :step="100"
/>
```

### Filtro de Quantidade de Produtos

```vue
<SmaeRangeInput
  name-min="qtd_min"
  name-max="qtd_max"
  :min="1"
  :max="100"
  :step="1"
  :formatar-moeda="false"
  :mostrar-inputs="true"
/>
```
