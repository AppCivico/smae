<script setup lang="ts">
import type { TipoUpload } from '@back/upload/entities/tipo-upload';
import {
  computed, ref, useTemplateRef, watch,
} from 'vue';

import SmaeLink from '@/components/SmaeLink.vue';
import { useUpload } from '@/composables/useUpload';

interface ArquivoBase {
  id: number;
  nome_original: string;
  tamanho_bytes: number;
  download_token: string;
}

interface ArquivoExistente {
  id: number;
  arquivo: ArquivoBase;
}

interface ArquivoNovo {
  upload_token: string;
  nome_original: string;
  tamanho_bytes: number;
}

type FnAdicionar = (arquivo: File) => Promise<string>;
type FnExcluir = (id: number) => Promise<void> | void;

type Props = {
  arquivosExistentes?: ArquivoExistente[];
  tipo?: TipoUpload;
  accept?: string;
  label?: string;
  required?: boolean;
  id?: string;
  name?: string;
  apenasNovos?: boolean,
  fnAdicionar?: FnAdicionar;
  fnExcluir?: FnExcluir;
};

type ArquivoNaLista =
  | { tipo: 'existente'; dados: ArquivoExistente }
  | { tipo: 'novo'; dados: ArquivoNovo };

const props = withDefaults(defineProps<Props>(), {
  arquivosExistentes: () => [],
  tipo: undefined,
  accept: undefined,
  label: 'Adicionar arquivo',
  id: 'upload-arquivos',
  name: '',
  fnAdicionar: undefined,
  fnExcluir: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [tokens: string[]];
  'arquivoExistenteRemovido': [id: number];
}>();

const model = defineModel<string[]>({ default: () => [] });

const {
  uploadArquivo,
  obterUrlDownload,
  carregando,
  erro,
} = useUpload();

const arquivosNovos = ref<ArquivoNovo[]>([]);
const inputRef = useTemplateRef('inputRef');

const listaUnificada = computed<ArquivoNaLista[]>(() => {
  const existentes: ArquivoNaLista[] = props.arquivosExistentes.map((arq) => ({
    tipo: 'existente',
    dados: arq,
  }));

  const novos: ArquivoNaLista[] = arquivosNovos.value.map((arq) => ({
    tipo: 'novo',
    dados: arq,
  }));

  return [...existentes, ...novos];
});

const tokensUnificados = computed<string[]>(() => {
  const tokensExistentes = props.arquivosExistentes.map((arq) => arq.arquivo.download_token);
  const tokensNovos = arquivosNovos.value.map((arq) => arq.upload_token);

  return [...tokensExistentes, ...tokensNovos];
});

function emitirTokens() {
  let tokens: string[] = [];
  if (props.apenasNovos) {
    tokens = arquivosNovos.value.map((a) => a.upload_token);
  } else {
    tokens = tokensUnificados.value;
  }

  model.value = tokens;
}

async function obterToken(file: File): Promise<string> {
  if (props.fnAdicionar) {
    return props.fnAdicionar(file);
  }

  if (props.tipo) {
    return uploadArquivo(file, props.tipo);
  }

  throw new Error('É necessário fornecer "tipo" ou "fnAdicionar"');
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  try {
    const token = await obterToken(file);

    arquivosNovos.value.push({
      upload_token: token,
      nome_original: file.name,
      tamanho_bytes: file.size,
    });

    emitirTokens();
  } catch {
    // erro já é tratado pelo composable
  } finally {
    input.value = '';
  }
}

async function removerArquivo(item: ArquivoNaLista) {
  if (item.tipo === 'existente') {
    if (props.fnExcluir) {
      await props.fnExcluir(item.dados.id);
    }

    emit('arquivoExistenteRemovido', item.dados.id);
    return;
  }

  const index = arquivosNovos.value.findIndex(
    (a) => a.upload_token === item.dados.upload_token,
  );

  if (index === -1) return;

  arquivosNovos.value.splice(index, 1);
  emitirTokens();
}

function obterChave(item: ArquivoNaLista, index: number): string {
  return item.tipo === 'existente'
    ? `existente-${item.dados.id}`
    : `novo-${index}`;
}

function limpar() {
  arquivosNovos.value = [];

  if (inputRef.value) {
    inputRef.value.value = '';
  }

  emitirTokens();
}

function abrirSeletorDeArquivos() {
  inputRef.value?.click();
}

watch(() => props.arquivosExistentes, () => {
  emitirTokens();
}, { deep: true });

defineExpose({
  tokensDeUpload: computed(() => arquivosNovos.value.map((a) => a.upload_token)),
  limpar,
  carregando,
  erro,
});
</script>

<template>
  <div class="upload-de-arquivos-em-lista">
    <ul
      v-if="listaUnificada.length"
      class="lista-arquivos"
    >
      <li
        v-for="(item, index) in listaUnificada"
        :key="obterChave(item, index)"
        class="lista-arquivos__item"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_doc" />
        </svg>

        <SmaeLink
          v-if="item.tipo === 'existente'"
          :to="obterUrlDownload(item.dados.arquivo.download_token)"
          download
          class="lista-arquivos__nome"
        >
          {{ item.dados.arquivo.nome_original }}
        </SmaeLink>

        <div
          v-else
          class="lista-arquivos__nome"
        >
          {{ item.dados.nome_original }}

          <svg
            width="24"
            height="24"
          >
            <use xlink:href="#i_clock" />
          </svg>
        </div>

        <button
          type="button"
          class="like-a__text addlink"
          title="Remover arquivo"
          @click="removerArquivo(item)"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_remove" />
          </svg>
        </button>
      </li>
    </ul>

    <input
      :id="`${id}-input`"
      ref="inputRef"
      type="file"
      :name="name"
      :accept="accept"
      :required="required && listaUnificada.length === 0"
      :disabled="carregando"
      class="upload-input"
      @change="handleFileChange"
    >

    <div
      v-if="carregando"
      class="upload-label upload-label--carregando"
    >
      <span class="upload-label__texto">
        Enviando...
      </span>
    </div>

    <slot v-else>
      <button
        class="like-a__text addlink"
        type="button"
        :disabled="carregando"
        @click="abrirSeletorDeArquivos"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_+" />
        </svg>

        {{ $props.label }}
      </button>
    </slot>

    <p
      v-if="erro"
      class="upload-erro"
    >
      {{ (erro as Error)?.message || 'Erro ao enviar arquivo. Tente novamente.' }}
    </p>
  </div>
</template>

<style lang="less">
.upload-de-arquivos-em-lista {
  width: 100%;
}

.lista-arquivos {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.lista-arquivos__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid @c200;

  &:last-child {
    border-bottom: none;
  }
}

.lista-arquivos__nome {
  display: flex;
  align-items: center;
  flex: 1;
  gap: .5rem;
  height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px dashed @c300;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;

  &:hover {
    border-color: @azul;
    background-color: @c50;
  }

  &:focus-within {
    border-color: @azul;
    outline: 2px solid @azul;
    outline-offset: 2px;
  }
}

.upload-label--carregando {
  cursor: wait;
  opacity: 0.7;
}

.upload-label__texto {
  font-size: 0.875rem;
  // color: @texto;
}

.upload-erro {
  color: @vermelho;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
