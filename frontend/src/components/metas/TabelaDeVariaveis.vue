<script setup>
import niveisRegionalizacao from '@/consts/niveisRegionalizacao';
import dateToField from '@/helpers/dateToField';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const alertStore = useAlertStore();
const authStore = useAuthStore();
const VariaveisStore = useVariaveisStore();

const route = useRoute();
const { indicador_id: indicadorId } = route.params;

const { permissions } = storeToRefs(authStore);

const props = defineProps({
  parentlink: {
    type: String,
    required: true,
  },
  variáveis: {
    type: Array,
    default: () => [],
  },
  indicadorRegionalizavel: {
    type: Boolean,
    required: true,
  },
  saoGlobais: {
    type: Boolean,
    default: false,
  },
});

async function apagarVariável(id) {
  const mensagem = props.saoGlobais
    ? 'Deseja mesmo remover a associação?'
    : 'Deseja mesmo remover esse item?';

  const acao = props.saoGlobais
    ? (variavelId) => requestS.delete(`${baseUrl}/plano-setorial-indicador/${indicadorId}/desassociar-variavel`, {
      variavel_id: variavelId,
    })
    : VariaveisStore.delete;

  alertStore.confirmAction(mensagem, async () => {
    try {
      if (await acao(id)) {
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
  <nav>
    <ul class="flex justifyleft mb1">
      <template v-if="!$props.saoGlobais">
        <li
          v-if="indicadorId"
          class="mr1"
        >
          <SmaeLink
            :to="{
              path: `${parentlink}/indicadores/${indicadorId}/variaveis/novo`,
              query: $route.query,
            }"
            class="addlink"
          >
            <span>Adicionar variável</span>
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>
          </SmaeLink>
        </li>
        <li class="mr1">
          <SmaeLink
            v-if="indicadorRegionalizavel"
            :to="{
              path: `${parentlink}/indicadores/${indicadorId}/variaveis/gerar`,
              query: $route.query,
            }"
            class="addlink"
          >
            <span>Gerar variáveis</span>
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>
          </SmaeLink>
        </li>
      </template>

      <slot name="dentro-do-menu" />
    </ul>
  </nav>

  <div
    role="region"
    aria-label="Variáveis"
    tabindex="0"
  >
    <table
      class="tablemain mb1"
    >
      <colgroup>
        <col>
        <col>
        <col>
        <col class="col--number">
        <col>
        <col>
        <col class="col--number">
        <col class="col--number">
        <col>
        <col class="col--minimum">
      </colgroup>

      <thead>
        <tr>
          <th>
            Código
          </th>
          <th>
            Título
          </th>
          <th>
            Nível de regionalização
          </th>
          <th class="cell--number">
            Valor base
          </th>
          <th>
            Periodicidade
          </th>
          <th>
            Unidade
          </th>
          <th class="cell--number">
            Casas decimais
          </th>
          <th class="cell--number">
            Atraso meses
          </th>
          <th>
            Acumulativa
          </th>
          <th />
        </tr>
      </thead>
      <tr
        v-for="v in variáveis"
        :key="v.id"
      >
        <td class="cell--nowrap">
          <span
            v-if="v.suspendida"
            class="tipinfo right"
          >
            <svg
              width="24"
              height="24"
              color="#F2890D"
            ><use xlink:href="#i_alert" /></svg><div>
              Suspensa do monitoramento físico em {{ dateToField(v.suspendida_em) }}
            </div>
          </span>
          {{ v.codigo }}
        </td>
        <td>{{ v.titulo }}</td>
        <td>{{ niveisRegionalizacao[v.regiao?.nivel]?.nome || '-' }}</td>
        <td class="cell--number">
          {{ v.valor_base }}
        </td>
        <td>{{ v.periodicidade }}</td>
        <td>
          {{ v.unidade_medida?.sigla }}
        </td>
        <td class="cell--number">
          {{ v.casas_decimais }}
        </td>
        <td class="cell--number">
          {{ v.atraso_meses }}
        </td>
        <td>{{ v.acumulativa ? 'Sim' : 'Não' }}</td>
        <td style="white-space: nowrap; text-align: right;">
          <span
            v-if="v.etapa"
            class="tipinfo left"
          >
            <svg
              width="24"
              height="24"
            ><use xlink:href="#i_clock" /></svg>
            <div>
              Vínculada à
              <strong>{{ v.etapa?.titulo || v.etapa }}</strong>
              do cronograma
            </div>
          </span>

          <template v-else>
            <button
              class="like-a__link tipinfo tprimary"
              :disabled="!permitirEdição(v.indicador_variavel) && !props.saoGlobais"
              @click="apagarVariável(v.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg><div>Remover</div>
            </button>

            <template v-if="!$props.saoGlobais">
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
            </template>
          </template>
        </td>
      </tr>
    </table>
  </div>
</template>
