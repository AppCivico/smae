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
            <component
              :is="arquivo.download_token ? SmaeLink : 'span'"
              :to="`${DOWNLOAD_URL}/${arquivo.download_token}`"
              download
            >
              {{ arquivo.nome_original }}
            </component>
          </td>

          <td>
            {{ arquivo.descricao }}
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
            :class="{ 'error': errors.descricao && !carregando }"
            :disabled="carregando"
          />
          <div
            v-if="!carregando"
            class="error-msg"
          >
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
            :disabled="carregando"
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
        <div class="">
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

        <div v-if="carregando">
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_spin" /></svg>
        </div>
      </div>
    </form>
  </article>
</template>

<script lang="ts" setup>
import SmaeLink from '@/components/SmaeLink.vue';
import { arquivoSimples as uploadSchema } from '@/consts/formSchemas';
import { useDocumentTypesStore } from '@/stores';
import { useFileStore } from '@/stores/file.store';
import { storeToRefs } from 'pinia';
import { Field, useForm } from 'vee-validate';
import { computed, ref } from 'vue';

export type ArquivoAdicionado = {
  nome_original: string,
  download_token: string
  descricao: string | null
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

const DOWNLOAD_URL = `${import.meta.env.VITE_API_URL}/download`;

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
const { carregando } = storeToRefs(fileStore);

documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const adicionandoArquivo = ref<boolean>(false);
const arquivoRequisitos = ref<ArquivoRequisitos>({
  descricao: '',
  tipo_documento_id: '',
});

const podeAdicionar = computed<boolean>(() => (
  !!(
    arquivoRequisitos.value.descricao && arquivoRequisitos.value.tipo_documento_id
  ) && !carregando.value
));

const listaArquivos = computed(() => {
  if (props.arquivos.length === 0) {
    return [{
      nome_original: '-',
      descricao: '-',
      download_token: '-',
    }];
  }

  return props.arquivos;
});

function iniciarAdicionarAquivo(): void {
  adicionandoArquivo.value = true;
}

const submit = handleSubmit(async (values) => {
  const { token, nomeOriginal, descricao } = await fileStore.upload({
    tipo_id: values.tipo_documento_id,
    descricao: values.descricao,
  }, values.arquivo);

  const arquivo = {
    nome_original: nomeOriginal,
    download_token: token,
    descricao,
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
