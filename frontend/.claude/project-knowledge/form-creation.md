## Formulários

### Schema Yup

- Schemas ficam em `src/consts/formSchemas/<entidade>.ts`
- Importar primitivos de `./initSchema` (não direto do `yup`):
  ```ts
  import {
    object,
    string,
    number,
    array,
    boolean,
    date,
    mixed,
  } from "./initSchema";
  ```
- Sempre usar `.label('Nome do Campo')` em cada campo — o `SmaeLabel` extrai isso automaticamente
- Campos opcionais: `.nullable()` ou `.nullableOuVazio()`
- Campos condicionais: `.when('outro_campo', { is: ..., then: ..., otherwise: ... })`
- Exportar como named export: `export const minhaEntidadeSchema = object().shape({ ... })`
- Schemas em `formSchemas/` separados **não** precisam ser registrados em `formSchemas.js` — são importados diretamente na view

### Componente CriarEditar.vue

Local: `src/views/<modulo>/<Entidade>CriarEditar.vue`

**Padrão com `useForm`** — formulários complexos (arrays dinâmicos, watches, valores computados):

```vue
<script lang="ts" setup>
import { storeToRefs } from "pinia";
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from "vee-validate";
import { onMounted, watch } from "vue";
import { useRouter } from "vue-router";

import { minhaEntidadeSchema as schema } from "@/consts/formSchemas/minhaEntidade";
import escaparDaRota from "@/helpers/escaparDaRota";
import { useMinhaEntidadeStore } from "@/stores/minhaEntidade.store";

const router = useRouter();

const props = defineProps<{ minhaEntidadeId?: number | null }>();
const minhaEntidadeStore = useMinhaEntidadeStore();
const { emFoco } = storeToRefs(minhaEntidadeStore);

const { errors, handleSubmit, isSubmitting, resetForm } = useForm({
  initialValues: emFoco,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (carga) => {
  await minhaEntidadeStore.salvarItem(carga, props.minhaEntidadeId);

  minhaEntidadeStore.$reset();
  escaparDaRota(router);
});

onMounted(() => {
  if (props.minhaEntidadeId)
    minhaEntidadeStore.buscarItem(props.minhaEntidadeId);
});

watch(emFoco, (novosValores) => {
  resetForm({ values: novosValores });
});
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="formularioSujo" />

  <form class="flex column g2" @submit="onSubmit">
    <!-- campos aqui -->

    <SmaeFieldsetSubmit :disabled="isSubmitting" :erros="errors" />
  </form>
</template>
```

> **Atenção:** O padrão com `<Form>` wrapper do vee-validate **não deve ser usado** neste projeto. Sempre use o padrão com `useForm` acima, independentemente da complexidade do formulário.

### Componentes de campo (globais)

| Componente                                                        | Uso                                        |
| ----------------------------------------------------------------- | ------------------------------------------ |
| `<SmaeLabel name="campo" :schema="schema" />`                     | Label com asterisco automático se required |
| `<Field name="campo" type="text" class="inputtext light" />`      | Input de texto padrão                      |
| `<Field name="campo" as="select" class="inputtext light">`        | Select                                     |
| `<ErrorMessage name="campo" class="error-msg" />`                 | Mensagem de erro inline                    |
| `<SmaeText name="campo" :schema="schema" />`                      | Textarea/input com contador de caracteres  |
| `<SmaeDateInput name="campo" />`                                  | Datepicker                                 |
| `<SmaeNumberInput name="campo" />`                                | Input numérico                             |
| `<AutocompleteField2 name="campo" :grupo="lista" label="nome" />` | Autocomplete multi-select                  |
| `<FieldArray name="array" v-slot="{ fields, push, remove }">`     | Array dinâmico de campos                   |
| `<FormErrorsList :errors="errors" />`                             | Lista todos os erros do formulário         |
| `<SmaeFieldsetSubmit :disabled="isSubmitting" />`                 | Botão salvar padronizado                   |
| `<CabecalhoDePagina :formulario-sujo="formularioSujo" />`         | Cabeçalho com botão de fechar              |

### Classes CSS utilitárias

- `flex g2` — flex com gap
- `f1` — flex: 1 (ocupa espaço disponível)
- `inputtext light` — estilo padrão de input
- `error-msg` — estilo de mensagem de erro
