<script setup>
import níveisRegionalização from '@/consts/niveisRegionalizacao';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();
const authStore = useAuthStore();
const IndicadoresStore = useIndicadoresStore();
const VariaveisStore = useVariaveisStore();

const { singleIndicadores } = storeToRefs(IndicadoresStore);

const route = useRoute();
const { indicador_id: indicadorId } = route.params;

const { permissions } = storeToRefs(authStore);

defineProps({
  parentlink: {
    type: String,
    required: true,
  },
  saoGlobais: {
    type: Boolean,
    default: false,
  },
});

const variáveisConsolidadas = computed(() => (
  Array.isArray(singleIndicadores?.value?.formula_variaveis)
    ? singleIndicadores.value.formula_variaveis
      .map((x) => VariaveisStore?.variáveisPorId?.[x.variavel_id] || x)
    : []));

async function apagarVariável(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    try {
      if (await VariaveisStore.delete(id)) {
        VariaveisStore.clear();
        VariaveisStore.getAll(indicadorId);
        alertStore.success('Item removido!');
      }
    } catch (error) {
      alertStore.error(error);
    }
  }, 'Remover');
}
function permitirEdição(indicadorVariavel) {
  if (!indicadorVariavel) {
    return true;
  }
  if (Array.isArray(indicadorVariavel)
    && indicadorVariavel.findIndex((x) => x.indicador_origem) === -1) {
    return true;
  }
  return false;
}
</script>
<template>
  <table
    class="tablemain mb1"
  >
    <thead>
      <tr>
        <th style="width:13.3%;">
          Código
        </th>
        <th style="width:13.3%;">
          Título
        </th>
        <th style="width:13.3%;">
          Nível de regionalização
        </th>
        <th style="width:13.3%;">
          Valor base
        </th>
        <th style="width:13.3%;">
          Periodicidade
        </th>
        <th style="width:13.3%;">
          Unidade
        </th>
        <th style="width:13.3%;">
          Casas decimais
        </th>
        <th style="width:13.3%;">
          Atraso meses
        </th>
        <th style="width:13.3%;">
          Acumulativa
        </th>
        <th
          v-if="!$props.saoGlobais"
          style="width:20%"
        />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="v in variáveisConsolidadas"
        :key="v.id"
      >
        <td>{{ v.codigo }}</td>
        <td>{{ v.titulo }}</td>
        <td>{{ v.regiao ? níveisRegionalização.find(e => e.id == v.regiao.nivel).nome : '-' }}</td>
        <td>{{ v.valor_base }}</td>
        <td>{{ v.periodicidade }}</td>
        <td>{{ v.unidade_medida?.sigla }}</td>
        <td>{{ v.casas_decimais }}</td>
        <td>{{ v.atraso_meses }}</td>
        <td>{{ v.acumulativa ? 'Sim' : 'Não' }}</td>
        <td
          v-if="!$props.saoGlobais"
          style="white-space: nowrap; text-align: right;"
        >
          <button
            class="like-a__link tipinfo tprimary"
            :disabled="!permitirEdição(v.indicador_variavel)"
            @click="apagarVariável(v.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg><div>Apagar</div>
          </button>
          <SmaeLink
            :to="{
              path: `${parentlink}/indicadores/${indicadorId}/variaveis/novo/${v.id}`,
              query: $route.query,
            }"
            class="tipinfo tprimary ml1"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_copy" /></svg><div>Duplicar</div>
          </SmaeLink>
          <SmaeLink
            v-if="permitirEdição(v.indicador_variavel)"
            :to="{
              path: `${parentlink}/indicadores/${indicadorId}/variaveis/${v.id}`,
              query: $route.query,
            }"
            class="tipinfo tprimary ml1"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg><div>Editar</div>
          </SmaeLink>
          <button
            v-else
            disabled
            class="like-a__link tipinfo tprimary ml1"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg><div>Editar</div>
          </button>
          <SmaeLink
            :to="{
              path: `${parentlink}/indicadores/${indicadorId}/variaveis/${v.id}/valores`,
              query: $route.query,
            }"
            class="tipinfo tprimary ml1"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_valores" /></svg><div>Valores Previstos e Acumulados</div>
          </SmaeLink>
          <SmaeLink
            v-if="permissions.CadastroPessoa?.administrador"
            :to="{
              path: `${parentlink}/indicadores/${indicadorId}/variaveis/${v.id}/retroativos`,
              query: $route.query,
            }"
            class="tipinfo tprimary ml1"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_check" /></svg><div>Valores Realizados Retroativos</div>
          </SmaeLink>
        </td>
      </tr>
    </tbody>
  </table>
</template>
