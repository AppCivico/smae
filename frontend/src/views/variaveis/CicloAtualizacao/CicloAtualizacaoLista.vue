<template>
  <section class="ciclo-atualizacao-lista">
    <header class="flex spacebetween center mb2 g2">
      <TítuloDePágina id="titulo-da-pagina" />

      <hr class="f1">
    </header>

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

    <ul class="ciclo-atualizacao-lista__listagem flex column g1">
      <li
        v-for="cicloAtualizacao in ciclosAtualizacao"
        :key="`ciclo-atualizacao--${cicloAtualizacao.id}`"
        class="listagem-item flex spacebetween center g05 pl1 pr1"
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
              Atualização com atraso: {{ cicloAtualizacao.atrasos?.length }}
            </div>
          </strong> -
          {{ truncate(cicloAtualizacao.titulo, 60) }}
        </h5>

        <div
          v-if="cicloAtualizacao.pode_editar"
          class="listagem-item__acoes"
        >
          <SmaeLink
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
        </div>
      </li>
    </ul>
  </section>

  <router-view />
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';

import { watch, computed } from 'vue';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';

import { useCicloAtualizacaoStore, VariavelCiclo } from '@/stores/cicloAtualizacao.store';
import truncate from '@/helpers/truncate';
import SmaeLink from '@/components/SmaeLink.vue';

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

const cicloAtualizacaoStore = useCicloAtualizacaoStore();

const $route = useRoute();

const tabs = {
  coleta: {
    aberta: true,
    etiqueta: 'Coleta',
    id: 'Preenchimento',
    aba: 'coleta',
  },
  aprovacao: {
    etiqueta: 'Aprovação',
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
      temAtraso: !!(item.atrasos && item.atrasos.length !== 0),
      icone: getIcons(item.pedido_complementacao ? 'complementacao' : 'coleta'),
    }),
  );

  return ciclosComIcone;
});

watch(() => $route.query, (query) => {
  const { aba, ...params } = query;

  if (Object.keys(query).length === 0) {
    return;
  }

  cicloAtualizacaoStore.getCiclosAtualizacao({
    ...params,
    fase: aba,
  });
}, { immediate: true });
</script>

<style lang="less" scoped>
.ciclo-atualizacao-lista__abas {
  :deep(.abas__navegação) {
    margin: 0 !important;
  }
}

.ciclo-atualizacao-lista__listagem {
  margin-top: 19px;
}

.listagem-item {
  border-radius: 5px;
  padding: 5px 0;
  background-color: #F9F9F9;
  border-bottom: 2px solid #B8C0CC;
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
