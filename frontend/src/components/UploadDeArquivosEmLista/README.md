# UploadDeArquivosEmLista

Componente para upload de múltiplos arquivos com exibição em lista. Suporta arquivos novos (upload) e arquivos existentes vindos do backend.

## Importação

```typescript
import UploadDeArquivosEmLista from '@/components/UploadDeArquivosEmLista/UploadDeArquivosEmLista.vue';
```

## Uso Básico

```vue
<template>
  <UploadDeArquivosEmLista
    v-model="tokens"
    tipo="DOCUMENTO"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadDeArquivosEmLista from '@/components/UploadDeArquivosEmLista/UploadDeArquivosEmLista.vue';

const tokens = ref<string[]>([]);
</script>
```

## Com Função Customizada de Upload

Use as props `fnAdicionar` e `fnExcluir` para comportamento customizado de upload e exclusão.

```vue
<template>
  <UploadDeArquivosEmLista
    v-model="tokens"
    :fn-adicionar="uploadCustomizado"
    :fn-excluir="excluirCustomizado"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const tokens = ref<string[]>([]);

async function uploadCustomizado(arquivo: File): Promise<string> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  const response = await api.post('/meu-endpoint/upload', formData);
  return response.data.token;
}

async function excluirCustomizado(id: number): Promise<void> {
  await api.delete(`/meu-endpoint/arquivos/${id}`);
}
</script>
```

## Com Arquivos Existentes

Use a prop `arquivosExistentes` para exibir arquivos já salvos no backend. O formato esperado é compatível com `DemandaConfigAnexoDto`.

```vue
<template>
  <UploadDeArquivosEmLista
    v-model="tokens"
    :arquivos-existentes="item?.anexos"
    tipo="DOCUMENTO"
    label="Adicionar anexo"
    @arquivo-existente-removido="handleRemoverExistente"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const tokens = ref<string[]>([]);
const idsParaRemover = ref<number[]>([]);

function handleRemoverExistente(id: number) {
  idsParaRemover.value.push(id);
}

// Ao salvar o formulário:
async function salvar() {
  await api.patch('/endpoint', {
    // ... outros campos
    anexos_novos: tokens.value,
    anexos_remover: idsParaRemover.value,
  });
}
</script>
```

## Props

| Prop | Tipo | Obrigatório | Default | Descrição |
|------|------|-------------|---------|-----------|
| `modelValue` | `string[]` | Não | `[]` | Array de upload tokens (v-model) |
| `arquivosExistentes` | `ArquivoExistente[]` | Não | `[]` | Arquivos existentes do backend |
| `tipo` | `TipoUpload` | Não* | `undefined` | Tipo de upload: `DOCUMENTO`, `ICONE_TAG`, etc |
| `accept` | `string` | Não | `undefined` | Extensões aceitas (ex: `.pdf,.doc`) |
| `label` | `string` | Não | `'Adicionar arquivo'` | Texto do botão de adicionar |
| `required` | `boolean` | Não | `false` | Se obrigatório (valida quando lista vazia) |
| `id` | `string` | Não | `'upload-arquivos'` | ID do campo (para vee-validate) |
| `name` | `string` | Não | `''` | Name do campo (para vee-validate) |
| `apenasNovos` | `boolean` | Não | `false` | Emite apenas tokens de arquivos novos (ignora existentes) |
| `fnAdicionar` | `(arquivo: File) => Promise<string>` | Não | `undefined` | Função customizada para upload |
| `fnExcluir` | `(id: number) => Promise<void> \| void` | Não | `undefined` | Função customizada para exclusão |

> **\*Nota:** A prop `tipo` é obrigatória apenas se `fnAdicionar` não for fornecida.

## Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `update:modelValue` | `string[]` | Emitido quando tokens mudam |
| `arquivoExistenteRemovido` | `number` | Emitido quando arquivo existente é removido (ID do anexo) |

## Métodos Expostos (via ref)

| Método/Propriedade | Tipo | Descrição |
|--------------------|------|-----------|
| `tokensDeUpload` | `ComputedRef<string[]>` | Array reativo de tokens de upload (apenas novos) |
| `limpar()` | `() => void` | Limpa todos os arquivos novos da lista |
| `carregando` | `Ref<boolean>` | Estado de carregamento do upload |
| `erro` | `Ref<string \| null>` | Mensagem de erro do upload |

### Exemplo usando ref

```vue
<template>
  <UploadDeArquivosEmLista
    ref="uploadRef"
    tipo="DOCUMENTO"
  />
  <button @click="limparArquivos" :disabled="uploadRef?.carregando">
    Limpar
  </button>
  <p v-if="uploadRef?.erro">{{ uploadRef.erro }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const uploadRef = ref();

function limparArquivos() {
  uploadRef.value?.limpar();
}

// Acessar tokens diretamente
function obterTokens() {
  return uploadRef.value?.tokensDeUpload ?? [];
}

// Verificar estado de carregamento
function estaCarregando() {
  return uploadRef.value?.carregando ?? false;
}
</script>
```

## Tipos TypeScript

```typescript
// Estrutura base de arquivo
interface ArquivoBase {
  id: number;
  nome_original: string;
  tamanho_bytes: number;
  download_token: string;
}

// Estrutura esperada para arquivos existentes (compatível com DemandaConfigAnexoDto)
interface ArquivoExistente {
  id: number;           // ID do registro de anexo (para remoção)
  arquivo: ArquivoBase;
}

// Estrutura interna para arquivos novos
interface ArquivoNovo {
  upload_token: string;
  nome_original: string;
  tamanho_bytes: number;
}

// Tipos das funções customizadas
type FnAdicionar = (arquivo: File) => Promise<string>;
type FnExcluir = (id: number) => Promise<void> | void;
```

## Prop `apenasNovos`

Quando `apenasNovos` é `true`, o `v-model` emite apenas os tokens de arquivos novos, ignorando os tokens de arquivos existentes. Útil quando a API espera apenas tokens novos separadamente.

```vue
<template>
  <UploadDeArquivosEmLista
    v-model="tokensNovos"
    :arquivos-existentes="item?.anexos"
    tipo="DOCUMENTO"
    apenas-novos
  />
</template>
```

## Comportamento

### Upload de Arquivos Novos
1. Usuário clica no campo ou arrasta arquivo
2. Arquivo é enviado automaticamente para `/upload`
3. Token de upload é adicionado à lista interna
4. Evento `update:modelValue` é emitido com array atualizado

### Arquivos Existentes
- Exibidos com link de download clicável
- Ao remover, emite `arquivoExistenteRemovido` com o ID
- O componente pai deve gerenciar a lista de IDs para remoção

### Remoção de Arquivos Novos
- Remove da lista interna
- Atualiza automaticamente o v-model

## Integração com Formulários

### Com vee-validate

```vue
<template>
  <Field v-slot="{ value, handleChange }" name="anexos">
    <UploadDeArquivosEmLista
      :model-value="value"
      tipo="DOCUMENTO"
      name="anexos"
      required
      @update:model-value="handleChange"
    />
  </Field>
</template>
```

### Exemplo Completo de Formulário

```vue
<template>
  <form @submit="onSubmit">
    <div class="mb2">
      <label class="label">Título</label>
      <input v-model="form.titulo" class="inputtext light" />
    </div>

    <div class="mb2">
      <label class="label">Anexos</label>
      <UploadDeArquivosEmLista
        v-model="form.anexos_novos"
        :arquivos-existentes="itemExistente?.anexos"
        tipo="DOCUMENTO"
        @arquivo-existente-removido="marcarParaRemocao"
      />
    </div>

    <button type="submit" class="btn">Salvar</button>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const props = defineProps<{
  itemExistente?: {
    id: number;
    titulo: string;
    anexos: ArquivoExistente[];
  };
}>();

const form = reactive({
  titulo: props.itemExistente?.titulo ?? '',
  anexos_novos: [] as string[],
  anexos_remover: [] as number[],
});

function marcarParaRemocao(id: number) {
  form.anexos_remover.push(id);
}

async function onSubmit() {
  if (props.itemExistente) {
    await api.patch(`/items/${props.itemExistente.id}`, form);
  } else {
    await api.post('/items', {
      titulo: form.titulo,
      anexos: form.anexos_novos,
    });
  }
}
</script>
```

## Dependências

- `SmaeLink.vue` - Componente de link para download de arquivos
- `useUpload` - Composable que fornece `uploadArquivo()`, `obterUrlDownload()`, `carregando` e `erro`
