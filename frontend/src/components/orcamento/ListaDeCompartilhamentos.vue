<script setup>
import SmallModal from '@/components/SmallModal.vue';
import months from '@/consts/months';
import patterns from '@/consts/patterns';
import dinheiro from '@/helpers/dinheiro';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/texto/truncate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import retornarQuaisOsRecentesDosItens from './helpers/retornarQuaisOsMaisRecentesDosItensDeOrcamento';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const rotaCorrente = useRoute();

const props = defineProps({
  pdm: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
  idDoItem: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  ano: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
  dotação: {
    type: String,
    required: true,
  },
  processo: {
    type: String,
    default: '',
  },
  notaEmpenho: {
    type: String,
    default: '',
  },
  título: {
    type: String,
    default: '',
  },
});

const diálogoAberto = ref(false);
const compartilhamentos = ref([]);
const chamadaPendente = ref(false);
const erro = ref(null);

const lista = computed(() => compartilhamentos.value
  .map((x) => {
    let prefixo = '';
    let código = '';
    let título = '';
    let rota = '';

    switch (true) {
      case !!x.atividade:
        prefixo = 'atividade';
        código = x.atividade.codigo;
        título = x.atividade.titulo;
        rota = {
          name: 'resumoDeAtividade',
          params: {
            atividade_id: x.atividade.id,
            iniciativa_id: x.iniciativa.id,
            meta_id: x.meta.id,
          },
        };
        break;
      case !!x.iniciativa:
        prefixo = 'iniciativa';
        código = x.iniciativa.codigo;
        título = x.iniciativa.titulo;
        rota = {
          name: 'resumoDeIniciativa',
          params: {
            iniciativa_id: x.iniciativa.id,
            meta_id: x.meta.id,
          },
        };
        break;
      case !!x.meta:
        prefixo = 'meta';
        código = x.meta.codigo;
        título = x.meta.titulo;
        rota = {
          name: 'meta',
          params: {
            meta_id: x.meta.id,
          },
        };
        break;

      default:
        break;
    }

    return {
      ...x,
      prefixo,
      código,
      título,
      rota,
      maisRecentesDosItens: retornarQuaisOsRecentesDosItens(x.itens),
    };
  }));

async function buscarCompartilhamentos(pdm, ano, dotação, extras) {
  let params = {};

  switch (true) {
    case !pdm:
    case !ano:
    case !dotação:
      compartilhamentos.value = [];
      return;

    case !patterns.dotação.test(dotação) && !patterns.dotaçãoComComplemento.test(dotação):
      compartilhamentos.value = [];
      return;

    default:
      params = { pdm_id: pdm, ano_referencia: ano, dotacao: dotação };
      break;
  }

  if (extras.idDoItem) {
    params.not_id = extras.idDoItem;
  }

  if (extras.processo) {
    params.processo = extras.processo.replace(/\D/g, '');
  }

  if (extras.notaEmpenho) {
    params.nota_empenho = extras.notaEmpenho;
  }

  chamadaPendente.value = true;
  try {
    let caminhoNaApi = '';

    switch (rotaCorrente.meta.entidadeMãe) {
      case 'pdm':
        caminhoNaApi = `${baseUrl}/orcamento-realizado/compartilhados-no-pdm`;
        break;

      case 'planoSetorial':
      case 'programaDeMetas':
        caminhoNaApi = `${baseUrl}/plano-setorial-orcamento-realizado/compartilhados-no-pdm`;
        break;
      default:
        console.trace('Caminho para orçamentos não pôde ser identificado.');
        throw new Error('Caminho para orçamentos não pôde ser identificado.');
    }

    const r = await requestS.get(caminhoNaApi, params);

    compartilhamentos.value = Array.isArray(r.linhas)
      ? r.linhas
      : r;
  } catch (error) {
    erro.value = error;
  } finally {
    chamadaPendente.value = false;
  }
}

watch(props, (novosValores) => {
  buscarCompartilhamentos(novosValores.pdm, novosValores.ano, novosValores.dotação, {
    idDoItem: novosValores.idDoItem,
    processo: novosValores.processo,
    notaEmpenho: novosValores.notaEmpenho,
  });
}, { immediate: true });
</script>
<template>
  <div
    v-if="chamadaPendente || compartilhamentos.length || erro"
    class="flex flexwrap g1 center"
  >
    <LoadingComponent
      v-if="chamadaPendente"
      class="fb100 horizontal"
    >
      Consultando dotação
    </LoadingComponent>
    <template v-else>
      <svg
        v-if="compartilhamentos.length"
        width="24"
        height="24"
        color="#F2890D"
      ><use xlink:href="#i_alert" /></svg>

      <p class="mb0">
        <template
          v-if="compartilhamentos.length"
        >
          Essa dotação possui <strong>{{ compartilhamentos.length }}</strong>
          compartilhamentos.
        </template>
        <template
          v-else
        >
          Essa dotação não está em uso em outros orçamentos.
        </template>
      </p>

      <button
        v-if="compartilhamentos.length"
        type="button"
        class="like-a__text addlink"
        aria-label="exibir"
        @click="diálogoAberto = true"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg><span>Ver detalhes</span>
      </button>
    </template>

    <ErrorComponent
      v-if="erro"
      class="fb100"
    >
      {{ erro }}
    </ErrorComponent>

    <SmallModal
      v-if="diálogoAberto"
    >
      <div class="flex spacebetween center mb2">
        <h2>
          {{ props.título || 'Compartilhamentos' }}
        </h2>
        <hr class="ml2 f1">

        <CheckClose
          :formulario-sujo="false"
          :apenas-emitir="true"
          @close="diálogoAberto = false"
        />
      </div>

      <table class="tablemain">
        <col>
        <col>
        <col>
        <col class="col--percentagem">
        <col>
        <col class="col--percentagem">
        <col>
        <thead>
          <tr>
            <th />
            <th />

            <th
              colspan="2"
              class="tc"
            >
              Valor empenho
            </th>
            <th
              colspan="2"
              class="tc"
            >
              Valor liquidação
            </th>
          </tr>
          <tr>
            <th />
            <th class="cell--number">
              Mês
            </th>

            <th
              class="cell--number"
              title="Porcentagem"
            >
              %
            </th>
            <th class="cell--number">
              R$
            </th>
            <th
              class="cell--number"
              title="Porcentagem"
            >
              %
            </th>
            <th class="cell--number">
              R$
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item) in lista"
            :key="item.id"
          >
            <th>
              <SmaeLink
                :title="item.título?.length > 36 ? item.título : undefined"
                :to="item.rota"
                exibir-desabilitado
              >
                {{ item.prefixo }} - {{ item.código }} - {{ truncate(item.título, 36) }}
              </SmaeLink>
            </th>
            <td class="cell--number">
              {{ months[item.maisRecentesDosItens.mês - 1] || item.maisRecentesDosItens.mês }}
            </td>
            <td class="cell--number">
              {{
                item.maisRecentesDosItens.percentualEmpenho
                  ? `${item.maisRecentesDosItens.percentualEmpenho}%`
                  : '-'
              }}
            </td>
            <td class="cell--number">
              {{
                item.maisRecentesDosItens.empenho
                  ? dinheiro(item.maisRecentesDosItens.empenho)
                  : '-'
              }}
            </td>
            <td class="cell--number">
              {{
                item.maisRecentesDosItens.percentualLiquidação
                  ? `${item.maisRecentesDosItens.percentualLiquidação}%`
                  : '-'
              }}
            </td>
            <td class="cell--number">
              {{
                item.maisRecentesDosItens.liquidação
                  ? dinheiro(item.maisRecentesDosItens.liquidação)
                  : '-'
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </SmallModal>
  </div>
</template>
