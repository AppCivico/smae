<script lang="ts" setup>
import type { DemandaArquivoDto } from '@back/casa-civil/demanda/entities/demanda.entity';
import { ref, useTemplateRef, watch } from 'vue';

import useUpload from '@/composables/useUpload';

import DeleteButton from '../SmaeTable/partials/DeleteButton.vue';
import SmaeTable from '../SmaeTable/SmaeTable.vue';
import SmallModal from '../SmallModal.vue';
import UploadDeArquivosEmLista from '../UploadDeArquivosEmLista/UploadDeArquivosEmLista.vue';

interface ArquivoDocumentoBase {
  descricao: string;
  autoriza_divulgacao: boolean;
  arquivo: {
    nome_original: string;
    download_token: string;
    preview: {
      mime_type: string;
      atualizado_em: string;
    };
  };
}

type ArquivoDocumento = ArquivoDocumentoBase & (
  | { id: string; upload_token?: string }
  | { id?: undefined; upload_token: string }
);

type Props = {
  modelValue?: ArquivoDocumento[]
};

type Emits = {
  (event: 'update:modelValue', value: ArquivoDocumento[]): void;
  (event: 'update:modelValue1', value: ArquivoDocumento[]): void;
};

const emit = defineEmits<Emits>();
const props = withDefaults(
  defineProps<Props>(),
  { modelValue: () => [] },
);

const inputRef = useTemplateRef('inputRef');

const exibirModal = ref<boolean>(false);
const arquivosLocais = ref<ArquivoDocumento[]>([]);

const {
  uploadArquivo,
  obterUrlDownload,
  carregando,
  erro,
} = useUpload();

function abrirModal() {
  exibirModal.value = true;
}

function fecharModal() {
  exibirModal.value = false;
}

function abrirSeletorDeArquivos() {
  inputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  try {
    const token = await uploadArquivo(file, 'DOCUMENTO');

    arquivosLocais.value.push({
      upload_token: token,
      descricao: 'desc',
      autoriza_divulgacao: false,
      arquivo: {
        nome_original: file.name,
        download_token: token,
        preview: {
          mime_type: file.type,
          atualizado_em: new Date().toISOString(),
        },
      },
    });

    // emitirTokens();
  } catch {
    // erro já é tratado pelo composable
  } finally {
    input.value = '';
  }
}

watch(() => props.modelValue, (val) => {
  arquivosLocais.value = val;
}, { immediate: true });
</script>

<template>
  <SmallModal
    :active="exibirModal"
    @close="fecharModal"
  >
    <form action="">
      <input
        ref="inputRef"
        style="display:none;"
        type="file"
        :disabled="carregando"
        class="upload-input"
        @change="handleFileChange"
      >
      <!--
      :id="`${id}-input`"

    :name="name"
      :accept="accept"
      :required="required && listaUnificada.length === 0"
      -->

      <!-- <UploadDeArquivosEmLista /> -->
      <button
        class="mt1 like-a__text addlink"
        type="button"
        @click="abrirSeletorDeArquivos"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_+" />
        </svg>

        Selecionar arquivo
      </button>
    </form>
  </SmallModal>

  <SmaeTable
    :dados="arquivosLocais"
    :colunas="[
      {
        chave: 'arquivo.nome_original',
        label: 'Nome',
      },
      {
        chave: 'descricao',
        label: 'Descricao'
      },
      {
        chave: 'arquivo.preview.mime_type',
        label: 'Tipo arquivo'
      },
      {
        chave: 'arquivo.preview.atualizado_em',
        label: 'Data'
      },
    ]"
  >
    <template #acoes="{linha}">
      <button>
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_edit" />
        </svg>
      </button>

      <DeleteButton
        :linha="linha"
        parametro-no-objeto-para-excluir="arquivo.nome_original"
      />
      <!-- @deletar="(item) => excluirItem(item)" -->
    </template>
  </SmaeTable>

  <button
    class="mt1 like-a__text addlink"
    type="button"
    @click="abrirModal"
  >
    <svg
      width="20"
      height="20"
    >
      <use xlink:href="#i_+" />
    </svg>

    Adicionar arquivo
  </button>
</template>
