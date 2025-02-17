<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store';
import { useOrgansStore } from '@/stores';
import type { SessaoDeDetalheLinhas } from './partials/VariaveisResumo/VariaveisResumoSessao.vue';
import VariaveisResumoSessao from './partials/VariaveisResumo/VariaveisResumoSessao.vue';

type SessaoDeDetalheOptions = 'propriedades' | 'orgao' | 'grupos' | 'variavel' | 'intervalos';

type SessaoDeDetalhe = {
  [key in SessaoDeDetalheOptions]: {
    titulo?: string,
    linhas: SessaoDeDetalheLinhas,
    quantidadeColunas?: number
  }
};

type CategororiaComAssunto = {
  id: number,
  nome: string,
  assuntos: {
    id: number,
    nome: string,
  }[]
};

type CategoriaComAssuntoMapeado = {
  [key: number]: CategororiaComAssunto
};


const assuntosStore = useAssuntosStore();
const variaveisGlobaisStore = useVariaveisGlobaisStore();

const organsStore = useOrgansStore();
const { órgãosPorId } = storeToRefs(organsStore);


const {
  emFoco,
} = storeToRefs(variaveisGlobaisStore);

const {
  categoriasPorId,
} = storeToRefs(assuntosStore);

assuntosStore.buscarCategorias();

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

const temVariavelCategorica = computed<boolean>(() => {
  if (!emFoco.value) {
    return false;
  }

  return !!emFoco.value.variavel_categorica_id;
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
      { label: 'Tipo de variável', valor: obterTipo.value.tipo },
      { label: 'Nome', valor: obterTipo.value.nome },
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
      quantidadeColunas: 3,
      linhas: [
        [
          { label: 'Polaridade', valor: emFoco.value.polaridade },
          { label: 'Unidade de medida', valor: `${emFoco.value.unidade_medida.sigla} - ${emFoco.value.unidade_medida.descricao}`, esconder: temVariavelCategorica.value },
          { label: 'Casas decimais', valor: emFoco.value.casas_decimais, esconder: temVariavelCategorica.value },
          { label: 'Valor base', valor: emFoco.value.valor_base, esconder: temVariavelCategorica.value },
          { label: 'Ano base', valor: emFoco.value.ano_base || '-', esconder: temVariavelCategorica.value },
          { label: 'Início da medição', valor: emFoco.value.inicio_medicao ? dateIgnorarTimezone(emFoco.value.inicio_medicao, 'MM/yyyy') : '-' },
          { label: 'Fim da medição', valor: emFoco.value.fim_medicao ? dateIgnorarTimezone(emFoco.value.fim_medicao, 'MM/yyyy') : '-' },
          { label: 'Periodicidade', valor: emFoco.value.periodicidade },
          { label: 'Defasagem da medição', valor: emFoco.value.atraso_meses },
        ],
      ],
    },
    orgao: {
      linhas: [
        [
          { label: 'Órgão responsável pela coleta', valor: emFoco.value.medicao_orgao?.sigla },
          { label: 'Órgão responsável pela conferência', valor: emFoco.value.validacao_orgao?.sigla },
          { label: 'Órgão responsável pela liberação', valor: emFoco.value.liberacao_orgao?.sigla },
        ],
      ],
    },
    grupos: {
      linhas: [
        [
          { label: 'Equipes de coleta', valor: formatarLista(emFoco.value.medicao_grupo) },
          { label: 'Equipes de conferência', valor: formatarLista(emFoco.value.validacao_grupo) },
          { label: 'Equipes de liberação', valor: formatarLista(emFoco.value.liberacao_grupo) },
        ],
      ],
    },
    variavel: {
      linhas: [
        [
          { label: 'Variável acumulativa', valor: simNao(emFoco.value.acumulativa), esconder: temVariavelCategorica.value },
          { label: 'Disponível como dado aberto', valor: simNao(emFoco.value.dado_aberto) },
        ],
      ],
    },
    intervalos: {
      titulo: 'Intervalos de interação',
      linhas: [
        [
          { label: 'Início da coleta', valor: emFoco.value.periodos.preenchimento_inicio },
          { label: 'Duração da coleta', valor: emFoco.value.periodos.preenchimento_duracao },
          { label: 'Duração da conferência', valor: emFoco.value.periodos.validacao_duracao },
          { label: 'Duração da liberação', valor: emFoco.value.periodos.liberacao_duracao },
        ],
      ],
    },
  };
});

const assuntosComCategoriasMapeados = computed<CategoriaComAssuntoMapeado>(() => {
  if (!emFoco.value) {
    return {};
  }

  return emFoco.value.assuntos.reduce<CategoriaComAssuntoMapeado>((amount, item) => {
    const categoriaId: number | null | undefined = item.categoria_assunto_variavel_id;

    if (!categoriaId) {
      return amount;
    }

    if (!amount[categoriaId]) {
      const categoria = categoriasPorId.value[categoriaId];

      amount[categoriaId] = {
        nome: categoria.nome,
        id: categoriaId,
        assuntos: [],
      };
    }

    amount[categoriaId].assuntos.push(item);

    return amount;
  }, {} as CategoriaComAssuntoMapeado);
});
</script>

<template>
  <header class="flex spacebetween center mb2 g2">
    <TítuloDePágina />

    <hr class="f1">
  </header>

  <section
    v-if="sessoes"
    class="variavel-detalhe"
  >
    <VariaveisResumoSessao
      :linhas="sessaoPrincipal"
      remover-divisoria
    />

    <article class="mt2 sessao sessao--assunto">
      <div class="flex center g4 sessao__divider">
        <h2 class="sessao__divider-titulo">
          Assuntos
        </h2>

        <hr class="f1">
      </div>

      <ul class="mt3 g1 assuntos-categoria">
        <li
          v-for="assuntoComCategoria in assuntosComCategoriasMapeados"
          :key="`assunto-categoria--${assuntoComCategoria.id}`"
          class="assuntos-categoria-item"
        >
          <h5 class="uc">
            {{ assuntoComCategoria.nome }}
          </h5>

          <ul class="flex column g05">
            <li
              v-for="assunto in assuntoComCategoria.assuntos"
              :key="`assunto-${assuntoComCategoria.id}--${assunto.id}`"
              class="particula"
            >
              {{ assunto.nome }}
            </li>
          </ul>
        </li>
      </ul>
    </article>

    <VariaveisResumoSessao
      v-for="(sessao, sessaoIndex) in sessoes"
      :key="`sessao--${sessaoIndex}`"
      :titulo="sessao.titulo"
      :linhas="sessao.linhas"
      :quantidade-colunas="sessao.quantidadeColunas"
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

.sessao__item {
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

.assuntos-categoria {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
</style>
