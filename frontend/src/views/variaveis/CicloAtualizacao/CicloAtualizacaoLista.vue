<template>
  <section class="ciclo-atualizacao-lista">
    <header class="flex spacebetween center mb2 g2">
      <TítuloDePágina id="titulo-da-pagina" />

      <hr class="f1">
    </header>

    <CicloAtualizacaoListaFiltro
      class="mb3"
    />

    <div class="flex spacebetween">
      <EnvelopeDeAbas
        :meta-dados-por-id="tabs"
        alinhamento="esquerda"
        class="ciclo-atualizacao-lista__abas"
      >
        <template
          v-for="(tab, tabIndex) in tabs"
          #[tabIndex]
          :key="tab.id"
        />
      </EnvelopeDeAbas>

      <div class="ciclo-atualizacao-lista__icones-opcoes flex g05">
        <h6
          v-for="(iconData, iconIndex) in icons"
          :key="`ciclo-atualizacao-icon--${iconIndex}`"
          class="ciclo-atualizacao-lista__icones-opcoes-item flex center"
        >
          <svg
            width="20"
            height="20"
          ><use :xlink:href="`#${iconData.icone}`" /></svg>
          {{ iconData.label }}
        </h6>
      </div>
    </div>

    <table class="ciclo-atualizacao-lista__listagem">
      <thead>
        <tr>
          <th scope="col">
            Código/Nome
          </th>

          <th scope="col">
            Referência
          </th>

          <th scope="col">
            Periodicidade
          </th>

          <th scope="col">
            Equipes responsáveis
          </th>

          <th scope="col">
            Prazo
          </th>

          <th scope="col" />
        </tr>
      </thead>

      <tbody
        v-for="cicloAtualizacao in ciclosAtualizacao"
        :key="`ciclo-atualizacao--${cicloAtualizacao.id}`"
        class="listagem-item"
      >
        <tr>
          <th
            scope="row"
            class="flex center g05"
          >
            <div class="listagem-item__icone">
              <svg
                :width="cicloAtualizacao.icone.tamanho"
                :height="cicloAtualizacao.icone.tamanho"
              ><use :xlink:href="`#${cicloAtualizacao.icone.icone}`" /></svg>
            </div>

            <h5 class="listagem-item__conteudo f1">
              <strong
                :class="{'tvermelho tipinfo like-a__text': cicloAtualizacao.temAtraso}"
              >
                {{ cicloAtualizacao.codigo }}
                <div v-if="cicloAtualizacao.temAtraso">
                  Atualização com atraso: {{ obterPrimeiroEUlticoAtraso(cicloAtualizacao.atrasos) }}
                </div>
              </strong> -
              {{ truncate(cicloAtualizacao.titulo, 60) }}
            </h5>
          </th>

          <td>
            {{ dateIgnorarTimezone(cicloAtualizacao.ultimo_periodo_valido, 'MM/yyyy') }}
          </td>

          <td>
            {{ cicloAtualizacao.periodicidade }}
          </td>

          <td>
            {{ cicloAtualizacao.equipes.map(i => i.titulo).join(", ") }}
          </td>

          <td>
            <span :class="{'tvermelho': cicloAtualizacao.temAtraso}">
              {{ dateIgnorarTimezone(cicloAtualizacao.prazo, 'dd/MM/yyyy') }}
            </span>
          </td>

          <th>
            <!-- TO-DO: passar a essa conferência para o Backend e usar apenas
`.pode_editar` -->
            <SmaeLink
              v-if="cicloAtualizacao.pode_editar && cicloAtualizacao.prazo"
              type="button"
              class="tipinfo tprimary like-a__text"
              exibir-desabilitado
              :to="{
                name: 'cicloAtualizacao.editar',
                params: {
                  cicloAtualizacaoId: cicloAtualizacao.id,
                  dataReferencia: cicloAtualizacao.ultimo_periodo_valido
                }
              }"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
              <div>Editar</div>
            </SmaeLink>
          </th>
        </tr>
      </tbody>

      <tbody
        v-if="ciclosAtualizacao.length === 0"
        class="listagem-item listagem-item--sem-resultado"
      >
        <tr>
          <td colspan="5">
            Sem itens a exibir
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <div>
    <router-view />
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import SmaeLink from '@/components/SmaeLink.vue';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import truncate from '@/helpers/texto/truncate';
import { useCicloAtualizacaoStore, VariavelCiclo } from '@/stores/cicloAtualizacao.store';
import CicloAtualizacaoListaFiltro from './partials/CicloAtualizacaoLista/CicloAtualizacaoListaFiltro.vue';

export type AbasDisponiveis = 'Preenchimento' | 'Validacao' | 'Liberacao';

type IconOpcoes = 'complementacao' | 'coleta';

type IconForma = {
  icone: string;
  tamanho: number;
  label: string
};

type IconsMap = {
  [key in IconOpcoes]: IconForma
};

type VariavelCicloComIcone = VariavelCiclo & {
  icone: IconForma
  temAtraso: boolean
};

const route = useRoute();

const cicloAtualizacaoStore = useCicloAtualizacaoStore(route.meta.entidadeMãe);

// TO-DO: passar para v-slots
const tabs: Record<string, {
  id: AbasDisponiveis,
  [key: string]: unknown;
}> = {
  coleta: {
    aberta: true,
    etiqueta: 'Coleta',
    id: 'Preenchimento',
    aba: 'coleta',
  },
  aprovacao: {
    etiqueta: 'Conferência',
    id: 'Validacao',
    aba: 'aprovacao',
  },
  liberacao: {
    etiqueta: 'Liberação',
    id: 'Liberacao',
    aba: 'liberacao',
  },
};

const icons: IconsMap = {
  coleta: {
    tamanho: 12,
    icone: 'i_circle',
    label: 'Coleta',
  },
  complementacao: {
    tamanho: 15,
    icone: 'i_alert',
    label: 'Complementação',
  },
};

function getIcons(reference: IconOpcoes): IconForma {
  return icons[reference] || icons.coleta;
}

const ciclosAtualizacao = computed(() => {
  const ciclosComIcone = cicloAtualizacaoStore.ciclosAtualizacao.map<VariavelCicloComIcone>(
    (item) => ({
      ...item,
      temAtraso: item.em_atraso,
      icone: getIcons(item.pedido_complementacao ? 'complementacao' : 'coleta'),
    }),
  );

  return ciclosComIcone;
});

function formatarReferencia(referencia: any): string | undefined {
  if (!referencia) return undefined;

  return `${referencia.split('/').reverse().join('-')}-01`;
}

function obterPrimeiroEUlticoAtraso(atrasos: string[] | null): string {
  if (!atrasos) {
    return '';
  }

  if (atrasos.length === 1) {
    const [atraso] = atrasos;

    return dateIgnorarTimezone(atraso, 'dd/MM/yyyy') || '-';
  }

  const primeiro = atrasos.at(0);
  const ultimo = atrasos.at(-1);

  return `${dateIgnorarTimezone(primeiro, 'dd/MM/yyyy')} ⋯ ${dateIgnorarTimezone(ultimo, 'dd/MM/yyyy')}`;
}

watch(() => route.query, (query) => {
  const { aba, ...params } = query;

  if (Object.keys(query).length === 0) {
    return;
  }

  cicloAtualizacaoStore.getCiclosAtualizacao({
    ...params,
    referencia: formatarReferencia(params.referencia),
    fase: aba,
  });
}, { immediate: true });
</script>
<style lang="less" scoped>
.ciclo-atualizacao-lista__abas {
  :deep(.abas__navegacao) {
    margin: 0 !important;
  }
}

.ciclo-atualizacao-lista__listagem {
  margin-top: 19px;
  width: 100%;
  overflow-x: auto;
  min-width: 1010px;

  thead {
    th {
      font-size: 12px;
      font-weight: 700;
      line-height: 15px;
      color: #B8C0CC;
      text-transform: uppercase;
    }
  }

  tr {
    > * {
      border: 5px solid transparent;
      border-left: 0;
      border-right: 0;
      text-align: left;

      padding-left: 2rem;

      &:first-child {
        padding-left: 12px;
      }

      &:last-child {
        padding-right: 12px;
      }
    }
  }
}

.listagem-item {
  border-left: 0;
  border-right: 0;
  border: 1rem solid #fff;

  tr {
    background-color: #F9F9F9;
  }
}

.listagem-item--sem-resultado {
  height: 45px;
}

.listagem-item__conteudo {
  font-size: 12px;
  font-weight: 900;
  line-height: 21px;
  letter-spacing: 0.05em;
  color: #3B5881;
  margin: 0;
}

.ciclo-atualizacao-lista__icones-opcoes-item {
  gap: 3px;
  margin: 0;
  font-size: 11px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0.02em;
}
</style>
