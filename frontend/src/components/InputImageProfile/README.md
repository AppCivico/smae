# InputImageProfile

Componente reutilizável para seleção e upload de imagens/ícones.

## Características

- Aceita arquivos `.jpg`, `.png`, `.jpeg`
- Suporta drag-and-drop
- Emite o arquivo `File` via `@update:model-value`

## Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `modelValue` | `String` | `''` | URL da imagem atual para exibição |
| `labelBotao` | `String` | `'carregar foto'` | Texto do botão de upload |

## Eventos

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `update:modelValue` | `File` | Emitido quando um arquivo é selecionado |

## Padrão de Uso com Upload

### 1. Template

```vue
<template>
  <Field v-slot="{ handleChange, value }" name="icone">
    <InputImageProfile
      :model-value="iconeAtualizado ? undefined : value"
      label-botao="carregar ícone"
      @update:model-value="async (file) => {
        const token = await handleIconeChange(file);
        handleChange(token);
      }"
    />
  </Field>
</template>
```

### 2. Script

```vue
<script setup lang="ts">
import InputImageProfile from '@/components/InputImageProfile/InputImageProfile.vue';

const iconeAtualizado = ref<boolean>(false);

async function handleIconeChange(file: unknown) {
  if (!file || typeof file !== 'object' || file.constructor.name !== 'File') {
    return file;
  }

  iconeAtualizado.value = true;
  const uploadToken = await store.uploadIcone(file as File);
  return uploadToken;
}

const onSubmit = handleSubmit.withControlled(async (formValues) => {
  if (!iconeAtualizado.value) {
    delete formValues.icone;
  }
  await store.salvarItem(formValues, props.escopoId);
});
</script>
```

### 3. Store Pinia - Método de Upload

```typescript
async uploadIcone(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('tipo', 'ICONE_PORTFOLIO'); // ajuste o tipo conforme necessário
  formData.append('arquivo', file);

  const resposta = await this.requestS.upload(
    `${import.meta.env.VITE_API_URL}/upload`,
    formData,
  ) as { upload_token: string };

  return resposta.upload_token;
}
```

### 4. Store Pinia - Método de Salvamento

```typescript
async salvarItem(params: any = {}, id = 0) {
  const requestParams = { ...params };

  if (requestParams.icone) {
    requestParams.sobrescrever_icone = true;
    requestParams.icone_upload_token = requestParams.icone || undefined;
    delete requestParams.icone;
  }

  await this.requestS.patch(`${rota}/${id}`, requestParams);
}
```

### 5. Getter para Exibir Imagem Existente

```typescript
getters: {
  itemParaEdicao({ emFoco }) {
    return {
      ...emFoco,
      icone: emFoco?.icone && `${import.meta.env.VITE_API_URL}/download/${emFoco.icone.download_token}`,
    };
  },
}
```

## Fluxo Completo

1. Usuário seleciona arquivo no `InputImageProfile`
2. Componente emite o `File` via `@update:model-value`
3. `handleIconeChange` faz upload via store e recebe `upload_token`
4. Token é armazenado no campo do formulário via vee-validate
5. Flag `iconeAtualizado` controla se deve enviar no submit
6. No submit, se atualizado, envia `sobrescrever_icone: true` e `icone_upload_token`
7. Para exibir imagem existente, usa URL: `${VITE_API_URL}/download/${download_token}`

## Exemplo de Uso

Veja implementação completa em:
- `frontend/src/views/projetos/TermoEncerramentoProjetoCriarEditar.vue`
