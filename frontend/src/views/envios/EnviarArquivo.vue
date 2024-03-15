<script setup>
import SmallModal from '@/components/SmallModal.vue';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useImportaçõesStore } from '@/stores/importacoes.store.ts';
import { usePdMStore } from '@/stores/pdm.store';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  mixed,
  number,
  object,
} from 'yup';

const route = useRoute();
const router = useRouter();
const importaçõesStore = useImportaçõesStore();
const PdMStore = usePdMStore();
const alertStore = useAlertStore();

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const curfile = reactive({});
const erro = ref(null);

let schema = object()
  .shape({
    arquivo: mixed()
      .label('Arquivo')
      .required('Selecione um arquivo'),
  });

function onSubmit(values) {
  const carga = values;

  try {
    curfile.loading = true;
    const formData = new FormData();
    Object.entries(carga).forEach((x) => {
      formData.append(x[0], x[1]);
    });

    requestS.upload(`${baseUrl}/upload`, formData)
      .then(async ({ upload_token: uploadToken }) => {
        if (uploadToken) {
          await importaçõesStore.associarArquivo({
            ...values,
            upload: uploadToken,
          });

          alertStore.success('Item adicionado com sucesso!');
          curfile.value = {};
          if (route.meta.rotaDeEscape) {
            router.push({ name: route.meta.rotaDeEscape });
          }
        } else {
          alertStore.error('`upload_token` ausente da resposta');
          erro.value = '`upload_token` ausente da resposta';
        }
      })
      .finally(() => {
        curfile.loading = false;
      });
  } catch (error) {
    alertStore.error(error);
    curfile.loading = false;
    erro.value = error;
  }
}

function addFile(e) {
  const { files } = e.target;
  curfile.name = files[0].name;
  [curfile.file] = files;
}

switch (route.meta.entidadeMãe) {
  case 'pdm':
    schema = schema.shape({
      pdm_id: number()
        .label('PdM')
        .required(),
    });
    if (!PdMStore.PdM?.length) {
      PdMStore.getAll();
    }
    break;

  case 'portfolio':
    schema = schema.shape({
      portfolio_id: number()
        .label('Portfólio')
        .required(),
    });
    if (!importaçõesStore.portfoliosPermitidos?.length) {
      importaçõesStore.buscarPortfolios();
    }
    break;

  default:
    break;
}
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <SmallModal>
    <div class="flex spacebetween center mb2">
      <h2>Enviar arquivo</h2>
      <hr class="ml2 f1">

      <CheckClose />
    </div>

    <template v-if="!curfile?.loading">
      aqui ia o formulário
    </template>
    <template v-else-if="curfile?.loading">
      <span class="spinner">Enviando o arquivo</span>
    </template>
    <template v-else-if="importaçõesStore.chamadasPendentes.arquivos">
      <span class="spinner">Associando o arquivo</span>
    </template>
    <template v-if="erro">
      <div class="error p1">
        <div class="error-msg">
          {{ erro }}
        </div>
      </div>
    </template>
  </SmallModal>
</template>
