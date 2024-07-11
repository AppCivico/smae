<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { contrato as schema } from '@/consts/formSchemas';
import dinheiro from '@/helpers/dinheiro';
import formatProcesso from '@/helpers/formatProcesso';
import { useAlertStore } from '@/stores/alert.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

const processosStore = useContratosStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(processosStore);

const obrasStore = useObrasStore();

const {
  permissõesDaObraEmFoco,
} = storeToRefs(obrasStore);

const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  processosStore.$reset();

  await processosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_processo === statusVisível.value))
));

const totalDeContratos = computed(() => lista.value
  .reduce(
    (acc, x) => ({
      aditivos: acc.aditivos + (x.quantidade_aditivos || 0),
      valor: acc.valor + (x.valor || 0),
    }),
    { aditivos: 0, valor: 0 },
  ));

const totalDeContratosFiltrados = computed(() => listaFiltrada.value
  .reduce(
    (acc, x) => ({
      aditivos: acc.aditivos + (x.quantidade_aditivos || 0),
      valor: acc.valor + (x.valor || 0),
    }),
    { aditivos: 0, valor: 0 },
  ));

function excluirProcesso(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover "${formatProcesso(nome)}"?`, async () => {
    if (await useContratosStore().excluirItem(id)) {
      alertStore.success('Processo removido.');

      await processosStore.buscarTudo();
    }
  }, 'Remover');
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Contratos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <div class="ml2">
      <router-link
        v-if="!permissõesDaObraEmFoco.apenas_leitura
          || permissõesDaObraEmFoco.sou_responsavel"
        :to="{ name: 'contratosDaObraCriar' }"
        class="btn"
      >
        Novo contrato
      </router-link>
    </div>
  </div>

  <div class="flex center mb1 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="f1"
    />
  </div>

  <table
    class="tablemain"
  >
    <colgroup>
      <col>
      <col>
      <col>
      <col>
      <col>
      <col
        v-if="!permissõesDaObraEmFoco.apenas_leitura
          || permissõesDaObraEmFoco.sou_responsavel"
        class="col--botão-de-ação"
      >
      <col
        v-if="!permissõesDaObraEmFoco.apenas_leitura
          || permissõesDaObraEmFoco.sou_responsavel"
        class="col--botão-de-ação"
      >
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th>
          {{ schema.fields.numero.spec.label }}
        </th>
        <th>
          {{ schema.fields.status.spec.label }}
        </th>
        <th class="cell--number">
          {{ schema.fields.valor.spec.label }}
        </th>
        <th>
          {{ schema.fields.processos_sei.spec.label }}
        </th>
        <th class="cell--number">
          {{ schema.fields.quantidade_aditivos.spec.label }}
        </th>
        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="linha in listaFiltrada"
        :key="linha.id"
      >
        <td class="">
          <router-link
            :to="{
              name: 'contratosDaObraResumo',
              params: {
                obraId: obraId,
                processoId: linha.id,
              }
            }"
          >
            {{ linha.numero }}
          </router-link>
        </td>
        <td>{{ linha.status }}</td>
        <td class="cell--number">
          R$ {{ dinheiro(linha.valor) }}
        </td>
        <td class="contentStyle">
          <ul v-if="linha.processos_sei.length">
            <li
              v-for="processoSei in linha.processos_sei"
              :key="processoSei"
            >
              {{ formatProcesso(processoSei) }} <br>
            </li>
          </ul>
        </td>
        <td class="cell--number">
          {{ linha.quantidade_aditivos }}
        </td>
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
          class="center"
        >
          <router-link
            :to="{
              name: 'contratosDaObraEditar',
              params: {
                obraId: obraId,
                processoId: linha.id,
              }
            }"
            title="Editar contrato"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
          class="center"
        >
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirProcesso(linha.id, linha.processo_sei)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>

      <tr v-if="!listaFiltrada.length">
        <td
          colspan="6"
          class="center"
        >
          Nenhum contrato encontrado.
        </td>

        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>

      <tr v-if="chamadasPendentes.lista">
        <td colspan="6">
          Carregando
        </td>
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>
      <tr v-else-if="erro">
        <td colspan="6">
          Erro: {{ erro }}
        </td>
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="6">
          Nenhum resultado encontrado.
        </td>
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>
    </tbody>
    <tfoot>
      <tr v-if="lista.length && lista.length > listaFiltrada.length">
        <th>Total dos contratos visiveis</th>
        <td />
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratosFiltrados.valor)}` }}
        </td>
        <td />
        <td class="cell--number">
          {{ totalDeContratosFiltrados.aditivos }}
        </td>
        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>
      <tr>
        <th>Total dos contratos</th>
        <td />
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratos.valor)}` }}
        </td>
        <td />
        <td class="cell--number">
          {{ totalDeContratos.aditivos }}
        </td>
        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>
    </tfoot>
  </table>

  <div
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
