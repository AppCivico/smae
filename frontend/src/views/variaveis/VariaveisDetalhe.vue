<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { computed } from 'vue';
import { format } from 'date-fns';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import VariaveisDetalheSessao from './partials/VariaveisDetalhe/VariaveisDetalheSessao.vue';
import type { SessaoDeDetalheLinhas } from './partials/VariaveisDetalhe/VariaveisDetalheSessao.vue';

type SessaoDeDetalheOptions = 'propriedades' | 'orgao' | 'grupos' | 'variavel' | 'intervalos';

type SessaoDeDetalhe = {
  [key in SessaoDeDetalheOptions]: {
    titulo?: string,
    linhas: SessaoDeDetalheLinhas,
  }
};

const variaveisGlobaisStore = useVariaveisGlobaisStore();

const {
  emFoco,
} = storeToRefs(variaveisGlobaisStore);

function simNao(valor: boolean) {
  return valor ? 'Sim' : 'Não';
}

function formatarLista(dados: { id: number, titulo: string }[]) {
  if (dados.length === 0) {
    return '-';
  }

  return dados.map((item) => item.titulo);
}

const obterTipo = computed<{ nome: string; tipo: string }>(() => {
  if (emFoco.value?.variavel_categorica === null) {
    return {
      tipo: 'Numérica',
      nome: 'Numérica',
    };
  }

  return {
    tipo: 'Categórica',
    nome: emFoco.value?.variavel_categorica.titulo || '-',
  };
});

const sessaoPrincipal = computed<SessaoDeDetalheLinhas>(() => {
  if (!emFoco.value) {
    return [];
  }

  return [
    [
      { label: 'Órgão proprietário', valor: emFoco.value.orgao_proprietario?.sigla },
      { label: 'Fonte', valor: emFoco.value.fonte?.nome },
      { label: 'Código', valor: emFoco.value.codigo },
    ],
    [
      { label: 'Nome', valor: obterTipo.value.nome },
      { label: 'Tipo de variável', valor: obterTipo.value.tipo },
    ],
    [
      { label: 'Descrição', valor: emFoco.value.descricao, col: 3 },
    ],
    [
      { label: 'Metodologia', valor: emFoco.value.metodologia, col: 3 },
    ],
  ];
});

const sessoes = computed<SessaoDeDetalhe | null>(() => {
  if (!emFoco.value) {
    return null;
  }

  return {
    propriedades: {
      linhas: [
        [
          { label: 'Polaridade', valor: emFoco.value.polaridade },
          { label: 'Unidade de medida', valor: `${emFoco.value.unidade_medida.sigla} - ${emFoco.value.unidade_medida.descricao}` },
          { label: 'Casas decimais', valor: emFoco.value.casas_decimais },
        ],
        [
          { label: 'Valor base', valor: emFoco.value.valor_base },
          { label: 'Ano base', valor: emFoco.value.ano_base || '-' },
          { label: 'Início da medição', valor: emFoco.value.inicio_medicao ? format(emFoco.value.inicio_medicao, 'MM/yyyy') : '-' },
        ],
        [
          { label: 'Fim da medição', valor: emFoco.value.fim_medicao ? format(emFoco.value.fim_medicao, 'MM/yyyy') : '-' },
          { label: 'Periodicidade', valor: emFoco.value.periodicidade },
          { label: 'Defasagem da medição', valor: emFoco.value.atraso_meses },
        ],
      ],
    },
    orgao: {
      linhas: [
        [
          { label: 'Órgão responsável', valor: emFoco.value.orgao.sigla },
        ],
      ],
    },
    grupos: {
      linhas: [
        [
          { label: 'Grupos de medição', valor: formatarLista(emFoco.value.medicao_grupo) },
          { label: 'Grupos de validação', valor: formatarLista(emFoco.value.validacao_grupo) },
          { label: 'Grupos de liberação', valor: formatarLista(emFoco.value.liberacao_grupo) },
        ],
      ],
    },
    variavel: {
      linhas: [
        [
          { label: 'Variável acumulativa?', valor: simNao(emFoco.value.acumulativa) },
          { label: 'Disponível como dado aberto', valor: simNao(emFoco.value.dado_aberto) },
        ],
      ],
    },
    intervalos: {
      titulo: 'Intervalos de interação',
      linhas: [
        [
          { label: 'Início do preenchimento', valor: emFoco.value.periodos.preenchimento_inicio },
          { label: 'Duração do preenchimento', valor: emFoco.value.periodos.preenchimento_duracao },
          { label: 'Duração da validação', valor: emFoco.value.periodos.validacao_duracao },
          { label: 'Duração da liberação', valor: emFoco.value.periodos.liberacao_duracao },
        ],
      ],
    },
  };
});
</script>

<template>
  <header class="flex spacebetween center mb2 g2">
    <TítuloDePágina id="titulo-da-pagina" />

    <hr class="f1">
  </header>

  <section
    v-if="sessoes"
    class="variavei-detalhe"
  >
    <VariaveisDetalheSessao
      :linhas="sessaoPrincipal"
      remover-divisoria
    />

    <article class="mt2 sessao sessao--assunto">
      <div class="flex center g4 sessao__divider">
        <h2 class="sessao__divider-titulo">
          Assunto
        </h2>

        <hr class="f1">
      </div>

      <ul class="mt3 flex g1">
        <li
          v-for="assunto in emFoco?.assuntos"
          :key="`assunto--${assunto.id}`"
          class="particula"
        >
          {{ assunto.nome }}
        </li>
      </ul>
    </article>

    <VariaveisDetalheSessao
      v-for="(sessao, sessaoIndex) in sessoes"
      :key="`sessao--${sessaoIndex}`"
      :titulo="sessao.titulo"
      :linhas="sessao.linhas"
    />
  </section>
</template>

<style lang="less" scoped>
.sessao__divider-titulo {
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #B8C0CC;
  margin: 0;
}

.sessao__item{
  max-width: 380px;
  padding: 24px 15px;
  font-size: 13px;
  font-weight: 400;
  line-height: 19px;
  color: #152741;

  border-color: #E3E5E8;
  border-bottom: .97px solid;

  &:first-of-type {
    border-top: .97px solid;
  }
}
</style>
