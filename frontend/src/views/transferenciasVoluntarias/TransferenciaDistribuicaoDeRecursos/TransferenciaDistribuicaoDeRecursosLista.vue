<template>
  <div>
    <div class="flex spacebetween center mb2 mt2">
      <TítuloDePágina />

      <hr class="ml2 f1">

      <CheckClose
        :formulario-sujo="formularioSujo"
        :apenas-emitir="true"
        @close="voltarTela"
      />
    </div>

    <div class="mb2">
      <div
        role="region"
        aria-label="Distribuições de recursos já cadastradas"
        tabindex="0"
        class="mb1"
      >
        <table class="tablemain mb1">
          <thead>
            <tr>
              <th>Gestor municipal</th>
              <th class="cell--number">
                Valor total
              </th>
              <th class="cell--data">
                Data de vigência
              </th>
              <th>Nome</th>
              <th />
              <th />
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in lista"
              :key="item.id"
            >
              <td>
                {{ item.orgao_gestor.sigla }}
              </td>
              <td class="cell--number">
                {{ item.valor_total ? dinheiro(item.valor_total) : '-' }}
              </td>
              <td class="cell--data">
                {{ dateToField(item.vigencia) }}
              </td>
              <td>
                {{ item.nome || '-' }}
              </td>
              <td>
                <button
                  class="like-a__text"
                  arial-label="editar"
                  title="editar"
                  type="button"
                  @click="editarDistribuicaoRecursos(item.id)"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_edit" />
                  </svg>
                </button>
              </td>
              <td>
                <button
                  class="like-a__text"
                  arial-label="excluir"
                  title="excluir"
                  type="button"
                  @click="excluirDistribuição(item.id)"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_remove" />
                  </svg>
                </button>
              </td>
            </tr>

            <tr v-if="chamadasPendentes.lista">
              <td
                colspan="6"
                class="loading"
              >
                carregando
              </td>
            </tr>

            <tr v-else-if="!lista.length">
              <td colspan="6">
                Nenhum Registro de Distribuição de Recursos encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        class="like-a__text addlink"
        @click="registrarNovaDistribuicaoRecursos"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_+" />
        </svg> Registrar nova distribuição de recurso
      </button>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useIsFormDirty } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';

const router = useRouter();
const { params } = useRoute();

const formularioSujo = useIsFormDirty();

const alertStore = useAlertStore();
const distribuicaoRecursos = useDistribuicaoRecursosStore();

const { chamadasPendentes, lista } = storeToRefs(distribuicaoRecursos);

async function excluirDistribuição(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await distribuicaoRecursos.excluirItem(id)) {
      distribuicaoRecursos.$reset();
      distribuicaoRecursos.buscarTudo({ transferencia_id: params.transferenciaId });
      alertStore.success('Distribuição removida.');
    }
  }, 'Remover');
}

function registrarNovaDistribuicaoRecursos() {
  router.push({
    name: 'TransferenciaDistribuicaoDeRecursos.Novo',
  });
}

function editarDistribuicaoRecursos(itemId) {
  router.push({
    name: 'TransferenciaDistribuicaoDeRecursos.Editar',
    params: {
      ...params,
      recursoId: itemId,
    },
  });
}

function voltarTela() {
  router.push({
    name: 'TransferenciasVoluntariasDetalhes',
    params: {
      ...params,
    },
  });
}

async function iniciar() {
  distribuicaoRecursos.buscarTudo({ transferencia_id: params.transferenciaId });
}

iniciar();

onUnmounted(() => {
  distribuicaoRecursos.$reset();
});
</script>
