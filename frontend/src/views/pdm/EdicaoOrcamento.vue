<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import months from '@/consts/months';
import { useAlertStore, useEditModalStore, usePdMStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Form } from 'vee-validate';
import { ref } from 'vue';

const pr = defineProps(['props']);
const { props } = pr;
const { pdm_id } = props;

const alertStore = useAlertStore();
const editModalStore = useEditModalStore();

const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);
const anosOrcamento = ref({});

const mesesDisponíveis = months.map((x, i) => ({ nome: x, id: i + 1 }));

(async () => {
  await PdMStore.getById(pdm_id);
  anosOrcamento.value = singlePdm.value.orcamento_config;
})();

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.orcamento_config = anosOrcamento.value;

    r = await PdMStore.updatePermissoesOrcamento(singlePdm.value.id, values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      editModalStore.clear();
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2 class="mb0">
      Permissões para edição do orçamento
    </h2>
    <hr class="ml2 f1">
    <button
      class="btn round ml2"
      @click="props.checkClose"
    >
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <hr class="mt2 mb2">
  <template v-if="!(singlePdm?.loading || singlePdm?.error)">
    <Form
      v-slot="{ isSubmitting }"
      @submit="onSubmit"
    >
      <div
        v-for="y in anosOrcamento"
        :key="y.id"
        class="mb2"
      >
        <h4>{{ y.ano_referencia }}</h4>
        <label class="block mb05"><input
          v-model="y.previsao_custo_disponivel"
          class="inputcheckbox"
          type="checkbox"
          value="true"
        ><span>Previsão de custo</span></label>
        <label class="block mb05"><input
          v-model="y.planejado_disponivel"
          class="inputcheckbox"
          type="checkbox"
          value="true"
        ><span>Orçamento planejado</span></label>
        <label class="block mb05"><input
          v-model="y.execucao_disponivel"
          class="inputcheckbox"
          type="checkbox"
          value="true"
        ><span>Execução orçamentária</span></label>

        <div class="f1 mt1 mb2">
          <label class="label">
            Meses disponíveis
          </label>

          <AutocompleteField
            name="execucao_disponivel_meses"
            :controlador="{ busca: '', participantes: y.execucao_disponivel_meses }"
            :v-model="y.execucao_disponivel_meses"
            :grupo="mesesDisponíveis"
            label="nome"
          />
          <ErrorMessage
            name="execucao_disponivel_meses"
            class="error-msg"
          />
        </div>
      </div>
      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn outline tcprimary bgnone mr1"
          type="button"
          @click="props.checkClose"
        >
          Cancelar
        </button>
        <button
          class="btn"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-if="singlePdm?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="singlePdm?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ singlePdm.error ?? error }}
      </div>
    </div>
  </template>
</template>
