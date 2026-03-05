# SmaeRangeInput

Slider de valor único com `v-model`. Componente primitivo, sem dependências de formulário.

## Props

| Prop         | Tipo               | Padrão | Descrição                                                         |
| ------------ | ------------------ | ------ | ----------------------------------------------------------------- |
| `modelValue` | `number`           | —      | **(obrigatória)** Valor atual do slider                           |
| `min`        | `number \| string` | `0`    | Valor mínimo                                                      |
| `max`        | `number \| string` | `100`  | Valor máximo                                                      |
| `step`       | `number \| string` | `1`    | Incremento                                                        |
| `name`       | `string`           | `''`   | Atributo `name` do input (útil para submit de formulário nativo)  |

## Emits

| Evento               | Payload  | Descrição                               |
| -------------------- | -------- | --------------------------------------- |
| `update:modelValue`  | `number` | Disparado a cada interação com o slider |

## Uso básico

```vue
<SmaeRangeInput v-model="nivel" />
```

## Com limites e step customizados

```vue
<SmaeRangeInput
  v-model="nivel"
  name="nivel"
  :min="1"
  :max="nivelMaximo"
  :step="1"
/>
```

## Estilização

O componente expõe duas variáveis CSS que podem ser sobrescritas pelo pai:

```css
--inputrange-thumb-size: 20px;  /* tamanho do thumb circular */
--inputrange-track-height: 4px; /* altura da trilha */
```

O preenchimento colorido da trilha é controlado internamente via `--inputrange-fill`, calculado automaticamente a partir de `modelValue`, `min` e `max`.

## Comportamento especial

- Quando `max <= min`, o fill é fixado em `100%`.
- O valor emitido é sempre do tipo `number`, independentemente do tipo das props `min`/`max`/`step`.
- Suporta o estado `disabled` via atributo nativo: o thumb fica opaco e não interativo.
