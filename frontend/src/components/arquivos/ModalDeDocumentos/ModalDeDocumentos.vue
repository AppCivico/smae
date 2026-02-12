<script lang="ts" setup>
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  ref, useTemplateRef, watch,
} from 'vue';

import SmaeLabel from '@/components/camposDeFormulario/SmaeLabel.vue';
import DeleteButton from '@/components/SmaeTable/partials/DeleteButton.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import SmallModal from '@/components/SmallModal.vue';
import useUpload from '@/composables/useUpload';
import dateToDate from '@/helpers/dateToDate';

import schema from './formularioArquivo';

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
  disabled?: boolean,
  modelValue?: ArquivoDocumento[]
};

type Emits = {
  (event: 'update:modelValue', value: ArquivoDocumento[]): void;
};

const {
  errors,
  isSubmitting,
  setFieldValue,
  handleSubmit,
  resetForm,
} = useForm({
  validationSchema: schema,
});

const emit = defineEmits<Emits>();
const props = withDefaults(
  defineProps<Props>(),
  { modelValue: () => [] },
);

const inputRef = useTemplateRef('inputRef');

const exibirModal = ref<boolean>(false);
const alterouArquivo = ref<boolean>(false);
const arquivosLocais = ref<ArquivoDocumento[]>([]);
const arquivoSelecionado = ref<File | null>(null);
const nomeArquivoSelecionado = ref<string>('');

const {
  uploadArquivo,
  obterUrlDownload,
  carregando,
  erro,
} = useUpload();

function abrirModal() {
  arquivoSelecionado.value = null;
  nomeArquivoSelecionado.value = '';
  exibirModal.value = true;
}

function fecharModal() {
  exibirModal.value = false;
}

function abrirSeletorDeArquivos() {
  inputRef.value?.click();
}

function handleEditarItem(linha) {
  abrirModal();

  resetForm({
    values: {
      id: linha.id,
      autoriza_divulgacao: linha.autoriza_divulgacao,
      descricao: linha.descricao,
      arquivo: linha.arquivo,
    },
  });

  nomeArquivoSelecionado.value = linha.arquivo.nome_original;
}

function handleFileChange(event: Event) {
  alterouArquivo.value = true;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  arquivoSelecionado.value = file;
  nomeArquivoSelecionado.value = file.name;
  setFieldValue('arquivo', file);

  input.value = '';
}

const onSubmit = handleSubmit.withControlled(async (values) => {
  const file = values.arquivo as File;

  try {
    let token;
    if (alterouArquivo.value) {
      token = await uploadArquivo(file, 'DOCUMENTO');
    }

    if (values.id) {
      const alvo = arquivosLocais.value.find((arquivo) => arquivo.id === values.id);
      if (!alvo) {
        throw new Error('Editando arquivo nao encontrado');
      }

      alvo.descricao = values.descricao;
      alvo.autoriza_divulgacao = values.autoriza_divulgacao;
      if (alterouArquivo.value) {
        alvo.id = undefined;
      }

      if (token) {
        alvo.upload_token = token;
        alvo.arquivo = {
          nome_original: file.name,
          download_token: token,
          preview: {
            mime_type: file.type,
            atualizado_em: new Date().toISOString(),
          },
        };
      }
    } else {
      if (!token) {
        throw new Error('Erro ao adicionar arquivo. Token não encontrado');
      }

      arquivosLocais.value.push({
        upload_token: token,
        descricao: values.descricao as string,
        autoriza_divulgacao: values.autoriza_divulgacao as boolean,
        arquivo: {
          nome_original: file.name,
          download_token: token,
          preview: {
            mime_type: file.type,
            atualizado_em: new Date().toISOString(),
          },
        },
      });
    }

    emit('update:modelValue', arquivosLocais.value);

    fecharModal();
  } catch (err) {
    console.error(err);
  }
});

watch(() => props.modelValue, (val) => {
  arquivosLocais.value = val ? [...val] : [];
  resetForm({ });
}, { immediate: true });

function onDeletarArquivo(linha: Record<string, unknown>) {
  const linhaTyped = linha as unknown as ArquivoDocumento;
  const index = arquivosLocais.value.findIndex(
    (item) => (linhaTyped.id && item.id === linhaTyped.id)
      || item.arquivo.nome_original === linhaTyped.arquivo.nome_original,
  );

  if (index !== -1) {
    arquivosLocais.value.splice(index, 1);
    emit('update:modelValue', arquivosLocais.value);
  }
}

watch(exibirModal, (exibir) => {
  if (exibir) {
    alterouArquivo.value = false;
  }
});
</script>

<template>
  <SmallModal
    :active="exibirModal"
    @close="fecharModal"
  >
    <h2>Adicionar arquivo</h2>

    <form @submit="onSubmit">
      <Field
        name="id"
        type="hidden"
      />

      <div class="mb1">
        <SmaeLabel
          name="descricao"
          :schema="schema"
        />

        <Field
          name="descricao"
          type="text"
          class="inputtext light mb1"
          :class="{ error: errors.descricao }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="descricao"
        />
      </div>

      <div class="mb1">
        <label class="flex center">
          <Field
            name="autoriza_divulgacao"
            type="checkbox"
            :value="true"
            class="inputcheckbox"
          />

          <SmaeLabel
            as="span"
            name="autoriza_divulgacao"
            :schema="schema"
            class="mb0"
          />
        </label>

        <ErrorMessage
          class="error-msg mb1"
          name="autoriza_divulgacao"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="arquivo"
          :schema="schema"
        />

        <input
          ref="inputRef"
          style="display:none;"
          type="file"
          :disabled="carregando"
          @change="handleFileChange($event)"
        >

        <Field
          name="arquivo"
          type="hidden"
        />

        <button
          class="like-a__text addlink"
          type="button"
          :disabled="carregando"
          :aria-busy="carregando"
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

        <span
          v-if="nomeArquivoSelecionado"
          class="ml1"
        >
          {{ nomeArquivoSelecionado }}
        </span>

        <ErrorMessage
          class="error-msg mb1"
          name="arquivo"
        />
      </div>

      <div
        v-if="erro"
        class="error-msg mb1"
      >
        Erro ao enviar arquivo. Tente novamente.
      </div>

      <div class="flex g2 justifycenter mt2">
        <button
          type="button"
          class="btn outline bgnone tcprimary"
          @click="fecharModal"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="btn"
          :disabled="isSubmitting || carregando"
        >
          {{ carregando ? 'Enviando...' : 'Adicionar' }}
        </button>
      </div>
    </form>
  </SmallModal>

  <SmaeTable
    :dados="arquivosLocais"
    :colunas="[
      {
        chave: 'arquivo.nome_original',
        label: 'Nome',
        ehCabecalho: true
      },
      {
        chave: 'descricao',
        label: 'Descrição'
      },
      {
        chave: 'autoriza_divulgacao',
        label: 'Autoriza divulgação',
        formatador: i => i ? 'Sim' : 'Não'
      },
      {
        chave: 'arquivo.preview.mime_type',
        label: 'Tipo arquivo'
      },
      {
        chave: 'arquivo.preview.atualizado_em',
        label: 'Data',
        formatador: dateToDate
      },
    ]"
  >
    <template #celula:arquivo__nome_original="{ linha }">
      <component
        :is="linha.id && linha.arquivo.download_token ? 'SmaeLink' : 'span'"
        :to="linha.id && obterUrlDownload(linha.arquivo.download_token)"
        class="flex center g05"
      >
        {{ linha.arquivo.nome_original }}

        <svg
          v-if="!linha.id"
          width="24"
          height="24"
        >
          <use xlink:href="#i_clock" />
        </svg>
      </component>
    </template>

    <template
      v-if="!$props.disabled"
      #acoes="{linha}"
    >
      <button
        class="like-a__text"
        @click="handleEditarItem(linha)"
      >
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
        @deletar="onDeletarArquivo"
      />
    </template>
  </SmaeTable>

  <button
    class="mt1 like-a__text addlink"
    type="button"
    :disabled="$props.disabled"
    :aria-disabled="$props.disabled"
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
