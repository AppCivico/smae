<template>
  <article>
    <table class="arquivos-tabela tablemain mb1">
      <thead>
        <tr>
          <th>Documento</th>
          <th>Descricao</th>
          <th />
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(arquivo, arquivoIndex) in listaArquivos"
          :key="`arquivo--${arquivoIndex}-${arquivoIndex}`"
        >
          <td class="arquivos-tabela__item arquivos-tabela__item--nome_original">
            {{ arquivo.nome_original }}
          </td>

          <td>
            -
          </td>

          <td>
            <button
              v-if="arquivo.nome_original !== '-'"
              class="like-a__text tprimary"
              @click="removerItem(arquivoIndex)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <button
      v-if="!adicionandoArquivo"
      class="addlink"
      @click="iniciarAdicionarAquivo"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg>

      <span>{{ label }}</span>
    </button>

    <form v-else>
      <div class="flex g2">
        <div class="f1">
          <LabelFromYup
            name="descricao"
            :schema="uploadSchema"
          />

          <Field
            v-model="arquivoRequisitos.descricao"
            name="descricao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.descricao }"
          />
          <div class="error-msg">
            {{ errors.descricao }}
          </div>
        </div>

        <div class="f1">
          <LabelFromYup
            name="tipo_documento_id"
            :schema="uploadSchema"
          />

          <Field
            v-model="arquivoRequisitos.tipo_documento_id"
            name="tipo_documento_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.tipo_documento_id }"
          >
            <option value="">
              Selecione
            </option>
            <option
              v-for="d in tempDocumentTypes"
              :key="d.id"
              :value="d.id"
            >
              {{ d.titulo }}
            </option>
          </Field>

          <div class="error-msg">
            {{ errors.tipo_documento_id }}
          </div>
        </div>
      </div>

      <div class="flex g2 mb2">
        <div class="f1">
          <LabelFromYup
            name="arquivo"
            :schema="uploadSchema"
          />

          <label
            :class="[
              'addlink',
              { 'error': errors.arquivo },
              {'disabled': !podeAdicionar}
            ]"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>

            <span>Selecionar arquivo</span>

            <input
              type="file"
              style="display:none;"
              @input="receberArquivo"
            >
          </label>

          <Field
            name="arquivo"
            as="file"
            type="hidden"
          />

          <div class="error-msg">
            {{ errors.arquivo }}
          </div>
        </div>
      </div>
    </form>
  </article>
</template>

<script lang="ts" setup>
import { ref, computed, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import { Field, useForm } from 'vee-validate';

import { useDocumentTypesStore } from '@/stores';
import { useFileStore } from '@/stores/file.store';

import { arquivoSimples as uploadSchema } from '@/consts/formSchemas';

import LabelFromYup from './LabelFromYup.vue';

export type ArquivoAdicionado = {
  nome_original: string,
  download_token: string
};

type ArquivoRequisitos = {
  descricao: string,
  tipo_documento_id: string,
};

type Props = {
  label: string,
  arquivos: ArquivoAdicionado[]
};

type Emits = {
  (event: 'novo-arquivo', novoArquivo: ArquivoAdicionado): void
  (event: 'remover-arquivo', itemIndex: number): void
};

const $emit = defineEmits<Emits>();
const props = defineProps<Props>();

const {
  errors, validate, handleSubmit, setFieldValue,
} = useForm({
  validationSchema: uploadSchema,
});

const fileStore = useFileStore();
const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const adicionandoArquivo = ref<boolean>(false);
const arquivoRequisitos = ref<ArquivoRequisitos>({
  descricao: '',
  tipo_documento_id: '',
});

const podeAdicionar = computed<boolean>(() => (
  !!(arquivoRequisitos.value.descricao && arquivoRequisitos.value.tipo_documento_id)
));

const listaArquivos = computed(() => {
  if (props.arquivos.length === 0) {
    return [{
      nome_original: '-',
      download_token: '-',
    }];
  }

  return props.arquivos;
});

function iniciarAdicionarAquivo(): void {
  adicionandoArquivo.value = true;
}

const submit = handleSubmit(async (values) => {
  const { token, nomeOriginal } = await fileStore.upload({
    tipo_id: values.tipo_documento_id,
    descricao: values.descricao,
  }, values.arquivo);

  const arquivo = {
    nome_original: nomeOriginal,
    download_token: token,
  };

  $emit('novo-arquivo', arquivo);
  adicionandoArquivo.value = false;

  arquivoRequisitos.value = {
    descricao: '',
    tipo_documento_id: '',
  };
});

async function receberArquivo(ev: Event): Promise<void> {
  setFieldValue('arquivo', ev);

  const { valid } = await validate();

  if (valid) {
    submit();
  }
}

function removerItem(itemIndex: number): void {
  $emit('remover-arquivo', itemIndex);
}

</script>

<style lang="less" scoped>
.arquivos-tabela {
  tbody td {
    &.arquivos-tabela__item--nome_original {
      width: 100%;
    }
  }
}
</style>
