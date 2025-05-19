<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import { grauDescricao } from '@back/common/RiscoCalc.ts';
import MenuDeMudançaDeStatusDeRisco from '@/components/riscos/MenuDeMudançaDeStatusDeRisco.vue';
import { risco as schema } from '@/consts/formSchemas';
import statuses from '@/consts/riskStatuses';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import requestS from '@/helpers/requestS.ts';
import { usePlanosDeAçãoStore } from '@/stores/planosDeAcao.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';

import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const planosDeAçãoStore = usePlanosDeAçãoStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const riscosStore = useRiscosStore();
const tarefasStore = useTarefasStore();

const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(riscosStore);

const linhasAbertas = ref([]);
const linhas = ref({});
const linhasPendentes = ref(false);

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  riscoId: {
    type: Number,
    default: 0,
  },
});

async function buscarMonitoramento(id) {
  linhasPendentes.value = true;

  if (linhas.value[id]) {
    return;
  }
  const u = await requestS.get(
    `${baseUrl}/projeto/${props.projetoId}/plano-acao-monitoramento`,
    {
      plano_acao_id: id,
    },
  );

  if (Array.isArray(u.linhas)) {
    linhas.value[id] = u.linhas;
  }

  linhasPendentes.value = false;
}

function iniciar() {
  planosDeAçãoStore.$reset();
  portfolioStore.buscarTudo();

  if (!tarefasStore.lista.length) {
    tarefasStore.buscarTudo();
  }
}

iniciar();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <div>
      <div
        v-if="emFoco?.eh_prioritario"
        class="t12 uc w700 tamarelo"
      >
        Risco prioritário
      </div>
      <TítuloDePágina />
    </div>

    <hr class="ml2 f1">
    <MenuDeMudançaDeStatusDeRisco
      v-if="emFoco?.id
        && (!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel)"
    />

    <router-link
      v-if="emFoco?.id
        && (!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel)"
      :to="{ name: 'riscosEditar', params: { riscoId: emFoco?.id } }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <div class="boards">
    <div class="flex g2 mb1">
      <dl
        v-if="emFoco?.descricao"
        class="f1 mb1"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['descricao'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.descricao }}
        </dd>
      </dl>

      <dl
        v-if="emFoco?.causa"
        class="f1 mb1"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['causa'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.causa }}
        </dd>
      </dl>
      <dl
        v-if="emFoco?.consequencia"
        class="f1 mb1"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['consequencia'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.consequencia }}
        </dd>
      </dl>
    </div>

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Grau
        </dt>
        <dd class="t13">
          {{ emFoco?.grau }} -
          <template v-if="emFoco?.grau">
            {{ grauDescricao[emFoco.grau - 1] }}
          </template>
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Resposta
        </dt>
        <dd class="t13">
          {{ emFoco?.resposta || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Status
        </dt>
        <dd class="t13">
          {{ statuses[emFoco?.status_risco] || '-' }}
        </dd>
      </dl>
    </div>

    <hr class="mb1 f1">

    <h2>
      Planos de ação
    </h2>

    <table
      v-if="emFoco?.planos_de_acao?.length"
      class="tablemain mb2"
    >
      <colgroup>
        <col class="col--botão-de-ação">
        <col>
        <col>
        <col class="col--data">
        <col class="col--number">
        <col class="col--number">
        <col
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
          class="col--botão-de-ação"
        >
        <col
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
          class="col--botão-de-ação"
        >
      </colgroup>

      <thead>
        <th />
        <th class="tl">
          Contramedidas
        </th>
        <th class="tl">
          Responsável
        </th>
        <th class="cell--data">
          Prazo
        </th>
        <th class="cell--number tr">
          Custo
        </th>
        <th class="cell--number tr">
          % custo projeto
        </th>
        <th
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
        />
        <th
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
        />
      </thead>

      <tbody
        v-for="item in emFoco?.planos_de_acao"
        :key="item.id"
      >
        <tr>
          <td class="accordeon">
            <label
              class="center like-a__text"
              aria-label="exibir planos de ação"
              style="min-width:13px; min-height:13px"
              @click="() => { if (!linhasAbertas.includes(item.id)) buscarMonitoramento(item.id) }"
            >
              <input
                v-model="linhasAbertas"
                type="checkbox"
                :value="item.id"
                hidden
              >
              <svg
                v-if="linhasAbertas.includes(item.id)"
                class="arrow"
                width="8"
                height="13"
              ><use xlink:href="#i_right" /></svg>
              <svg
                v-else
                class="arrow"
                width="13"
                height="8"
              ><use xlink:href="#i_down" /></svg>
            </label>
          </td>
          <th>
            <router-link
              :to="{ name: 'detalhes',
              params: { planoId: item.id }}"
              >
              {{ item.contramedida }}
            </router-link>

          </th>
          <td>
            {{ item.responsavel || item.orgao.sigla }}
          </td>
          <td class="cell--data">
            {{ dateToField(item.prazo_contramedida) }}
            <i
              v-if="!item.data_termino"
              class="tooltip tooltip--danger"
              title="Término pendente"
            >!</i>
          </td>
          <td class="cell--number">
            {{ typeof item.custo == 'number' ? 'R$' + dinheiro(item.custo) : '-' }}
          </td>
          <td class="cell--number">
            {{ typeof item.custo_percentual === 'number' ? item.custo_percentual + '%' : '-' }}
          </td>
          <td
            v-if="!permissõesDoProjetoEmFoco.apenas_leitura
              || permissõesDoProjetoEmFoco.sou_responsavel"
            class="center"
          >
            <router-link
              :to="{
                name: 'planosDeAçãoMonitoramento',
                params: {
                  planoId: item.id
                }
              }"
              title="Adicionar ponto de monitoramento"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg>
            </router-link>
          </td>
          <td
            v-if="!permissõesDoProjetoEmFoco.apenas_leitura
              || permissõesDoProjetoEmFoco.sou_responsavel"
            class="center"
          >
            <router-link
              :to="{
                name: 'planosDeAçãoEditar',
                params: {
                  planoId: item.id
                }
              }"
              title="Editar plano-de-ação"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </router-link>
          </td>
        </tr>
        <tr
          v-if="linhasAbertas.includes(item.id)"
        >
          <td
            :colspan="!permissõesDoProjetoEmFoco.apenas_leitura
              || permissõesDoProjetoEmFoco.sou_responsavel
              ? 8
              : 6"
          >
            <table
              v-if="linhas[item.id]"
              class="tablemain"
            >
              <colgroup>
                <col class="col--data">
                <col>
              </colgroup>

              <tr
                v-for="monitoramento in linhas[item.id]"
                :key="monitoramento.id"
              >
                <td>{{ dateToField(monitoramento.data_afericao) }}</td>
                <td>{{ monitoramento.descricao }}</td>
              </tr>
            </table>
            <span
              v-else-if="linhasPendentes"
              class="spinner"
            >Carregando</span>
          </td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="!permissõesDoProjetoEmFoco.apenas_leitura
        || permissõesDoProjetoEmFoco.sou_responsavel"
    >
      <router-link
        :to="{
          name: 'planosDeAçãoCriar'
        }"
        class="addlink mb1"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg> <span>Adicionar plano de ação</span>
      </router-link>
    </p>
  </div>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
