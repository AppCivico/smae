<script setup>
import ParlamentaresCadastrarSuplentes from '@/components/parlamentares/ParlamentaresCadastrarSuplentes.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { storeToRefs } from 'pinia';
import { computed, defineProps, ref } from 'vue';

const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();

const {
  emFoco, chamadasPendentes, erro, pessoaParaEdição,
} = storeToRefs(parlamentaresStore);

const props = defineProps({
  exibirEdição: {
    type: Boolean,
    default: false,
  },
  parlamentarId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

const suplentes = computed(() => emFoco.value?.mandato_atual?.suplentes ?? []);
const podeTerSuplentes = computed(() => !emFoco.value?.mandato_atual?.suplencia
  && !(emFoco.value?.mandato_atual?.suplentes?.length >= 2)
  && emFoco.value?.mandato_atual?.id);

const showSuplentesModal = ref(false);

const abrirModalSuplentes = () => {
  showSuplentesModal.value = true;
};

function excluirSuplente(suplenteId, parlamentarId = emFoco.value.id) {
  alertStore.confirmAction('Deseja mesmo remover a pessoa nessa suplência?', async () => {
    if (await useParlamentaresStore().excluirSuplente(suplenteId, parlamentarId)) {
      alertStore.success('Suplente removida.');
      parlamentaresStore.buscarItem(parlamentarId);
    }
  }, 'Remover');
}
</script>
<template>
  <div
    v-if="!emFoco?.mandato_atual?.suplencia"
    class="mb4"
  >
    <div class="flex spacebetween center">
      <h3 class="c500">
        Suplentes
      </h3>
      <hr class="ml2 f1">
    </div>
    <table class="tablemain mb1">
      <col>
      <col>
      <col>
      <col>
      <col>
      <col
        v-if="exibirEdição"
        class="col--botão-de-ação"
      >
      <thead>
        <tr>
          <th>Ordem</th>
          <th>ID do Parlamentar</th>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Email</th>
          <th v-if="exibirEdição" />
        </tr>
      </thead>
      <tbody v-if="suplentes.length">
        <tr
          v-for="(suplente, index) in suplentes"
          :key="suplente.id"
        >
          <td>{{ index === 0 ? '1º' : '2º' }}</td>
          <td>{{ suplente.parlamentar.id }}</td>
          <td>{{ suplente.parlamentar.nome }}</td>
          <td>{{ suplente.parlamentar.telefone }}</td>
          <td>{{ suplente.parlamentar.email }}</td>
          <td v-if="exibirEdição">
            <button
              class="like-a__text"
              aria-label="excluir"
              title="excluir"
              type="button"
              @click="excluirSuplente(suplente.id, emFoco.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="5">
            Nenhum suplente encontrado.
          </td>
        </tr>
      </tbody>
    </table>
    <button
      v-if="exibirEdição && podeTerSuplentes"
      class="like-a__text addlink"
      type="button"
      @click="abrirModalSuplentes"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_+" />
      </svg>
      Adicionar suplente
    </button>
  </div>
  <ParlamentaresCadastrarSuplentes
    v-if="showSuplentesModal"
    :apenas-emitir="true"
    :parlamentar-id="emFoco?.id"
    :mandato-id="emFoco?.mandato_atual?.id"
    @close="() => {
      showSuplentesModal = false;
      parlamentaresStore.buscarItem(emFoco.id);
    }"
  />
</template>
<style scoped ang="less">
h3{
  color: #607A9F;
  font-weight: 700;
  font-size: 24px;
}
table{
  max-width: 1000px;
  margin: 0 auto;
}
</style>
