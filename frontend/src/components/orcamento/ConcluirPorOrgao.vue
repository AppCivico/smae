<script setup>
import SmallModal from '@/components/SmallModal.vue';
import dateToDate from '@/helpers/dateToDate';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const OrcamentosStore = useOrcamentosStore();

const { OrcamentoRealizadoConclusaoAdmin } = storeToRefs(OrcamentosStore);

const emit = defineEmits(['close']);

const props = defineProps({
  ano: {
    type: [Number, String],
    required: true,
  },
  meta: {
    type: [Number, String],
    required: true,
  },
});
const opçõesDeData = { timeStyle: 'short' };

const salvamentoPendente = ref([]);

async function concluirOrçamento(evento, índice) {
  salvamentoPendente.value.push(índice);

  const posiçãoDoÍndice = salvamentoPendente.value.indexOf(índice);

  try {
    const resultado = await OrcamentosStore.closeOrcamentoRealizadoPorOrgao({
      meta_id: Number(props.meta),
      ano_referencia: Number(props.ano),
      concluido: evento.target.checked,
      orgao_id: Number(evento.target.value),
    });

    console.debug('resultado', resultado);

    OrcamentoRealizadoConclusaoAdmin.value[props.ano][índice].concluido = !!resultado;
  } catch (error) {
    evento.preventDefault();
  } finally {
    salvamentoPendente.value.splice(posiçãoDoÍndice, 1);
  }
}

</script>
<template>
  <SmallModal
    class="small"
    @close="emit('close')"
  >
    <div class="flex spacebetween center mb2">
      <h2>
        Concluir orçamentos
      </h2>
      <hr class="ml2 f1">

      <CheckClose
        :apenas-emitir="true"
        :formulário-sujo="false"
        @close="emit('close')"
      />
    </div>

    <table class="tablemain">
      <col>
      <col class="col--minimum">
      <col class="col--botão-de-ação">
      <thead>
        <th>
          Órgão
        </th>
        <th />
        <th>
          Concluir
        </th>
      </thead>
      <tbody v-if="OrcamentoRealizadoConclusaoAdmin[ano]">
        <tr
          v-for="(item, i) in OrcamentoRealizadoConclusaoAdmin[ano]"
          :key="i"
        >
          <td
            :class="{
              loading: salvamentoPendente.indexOf(i) !== -1
            }"
          >
            <abbr :title="item.orgao?.descricao">
              {{ item.orgao?.sigla }}
            </abbr>
          </td>
          <td>
            <div
              v-if="item.concluido && (item.concluido_por?.nome_exibicao || item.concluido_em)"
              class="tipinfo block"
              style="min-width: 20px;"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_i" /></svg><div>
                Concluído
                <template v-if="item.concluido_por?.nome_exibicao">
                  por
                  <strong>{{ item.concluido_por?.nome_exibicao }}</strong>
                </template>
                <template v-if="item.concluido_em">
                  em
                  <time :datetime="item.concluido_em">
                    {{ dateToDate(item.concluido_em, opçõesDeData) }}
                  </time>
                </template>
              </div>
            </div>
          </td>
          <td>
            <input
              ref="campoPlanoConcluído"
              type="checkbox"
              name="plano-concluído"
              class="interruptor"
              :checked="item.concluido"
              :value="item.orgao.id"
              @click.prevent="($e) => {
                concluirOrçamento($e, i);
              }"
            >
          </td>
        </tr>
      </tbody>
    </table>
  </SmallModal>
</template>
