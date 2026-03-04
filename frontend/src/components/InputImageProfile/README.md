# InputImageProfile

Componente reutilizavel para selecao e upload de imagens/icones.

## Caracteristicas

- Aceita arquivos `.jpg`, `.png`, `.jpeg`
- Suporta drag-and-drop
- Emite o arquivo `File` via `@update:model-value`

## Props

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `modelValue` | `String` | `''` | URL da imagem atual para exibicao |
| `labelBotao` | `String` | `'carregar foto'` | Texto do botao de upload |
| `exibirBotaoExcluir` | `Boolean` | `false` | Exibe botao para excluir imagem |

## Eventos

| Evento | Payload | Descricao |
|--------|---------|-----------|
| `update:modelValue` | `File \| null` | Emitido quando um arquivo e selecionado ou excluido |
| `excluir` | - | Emitido quando o botao de excluir e clicado |

## Composable useUpload

O composable `useUpload` encapsula a logica de upload de arquivos para a API.

### API

```typescript
import { useUpload } from '@/composables/useUpload';

const { carregando, erro, uploadArquivo, obterUrlDownload } = useUpload();

// Upload de arquivo
const token = await uploadArquivo(file, 'ICONE_PORTFOLIO');

// Obter URL para exibir imagem existente
const url = obterUrlDownload(downloadToken);
```

### Retorno

| Propriedade | Tipo | Descricao |
|-------------|------|-----------|
| `carregando` | `Ref<boolean>` | Estado de loading durante upload |
| `erro` | `Ref<unknown>` | Erro ocorrido durante upload |
| `uploadArquivo` | `(file: File, tipo?: TipoUpload) => Promise<string>` | Faz upload e retorna token |
| `obterUrlDownload` | `(token: string) => string` | Gera URL de download |

### Tipos de Upload

- `ICONE_PORTFOLIO` - Para icones/imagens de perfil (default)
- `DOCUMENTO` - Para documentos

## Padrao de Uso

### Template

```vue
<template>
  <Field v-slot="{ handleChange, value }" name="icone">
    <InputImageProfile
      :model-value="iconeAtualizado ? undefined : value"
      label-botao="carregar icone"
      exibir-botao-excluir
      @update:model-value="async (file) => {
        const token = await handleIconeChange(file);
        handleChange(token);
      }"
    />
  </Field>
</template>
```

### Script

```vue
<script setup lang="ts">
import { ref } from 'vue';
import InputImageProfile from '@/components/InputImageProfile/InputImageProfile.vue';
import { useUpload } from '@/composables/useUpload';

const { uploadArquivo, obterUrlDownload } = useUpload();
const iconeAtualizado = ref(false);

async function handleIconeChange(file: unknown) {
  if (file === null) {
    iconeAtualizado.value = true;
    return null;
  }

  if (!file || typeof file !== 'object' || !(file instanceof File)) {
    return file;
  }

  iconeAtualizado.value = true;
  return await uploadArquivo(file, 'ICONE_PORTFOLIO');
}

const onSubmit = handleSubmit.withControlled(async (formValues) => {
  const params = { ...formValues };

  if (iconeAtualizado.value) {
    params.sobrescrever_icone = true;
    params.icone_upload_token = params.icone || null;
  }
  delete params.icone;

  await store.salvarItem(params, id);
});
</script>
```

### Getter para Valores Iniciais

Para exibir uma imagem existente, use `obterUrlDownload`:

```typescript
import { useUpload } from '@/composables/useUpload';

const { obterUrlDownload } = useUpload();

const valoresIniciais = computed(() => ({
  ...emFoco.value,
  icone: emFoco.value?.icone
    ? obterUrlDownload(emFoco.value.icone.download_token)
    : undefined,
}));
```

## Fluxo Completo

1. Usuario seleciona arquivo no `InputImageProfile`
2. Componente emite o `File` via `@update:model-value`
3. `handleIconeChange` faz upload via `useUpload` e recebe `upload_token`
4. Token e armazenado no campo do formulario via vee-validate
5. Flag `iconeAtualizado` controla se deve enviar no submit
6. No submit, se atualizado, envia `sobrescrever_icone: true` e `icone_upload_token`
7. Para exibir imagem existente, usa `obterUrlDownload(download_token)`

## Exemplo de Implementacao

Veja implementacao completa em:
- `frontend/src/views/projetos/TermoEncerramentoProjetoCriarEditar.vue`
