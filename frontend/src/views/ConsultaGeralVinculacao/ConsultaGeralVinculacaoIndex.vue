<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import EtapasEmBarras from '@/components/EtapasEmBarras.vue';
import SmallModal from '@/components/SmallModal.vue';
import PaginacaoInicial from '@/consts/PaginacaoInicial';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import type { ItemConsultaGeralFormatado } from '@/stores/entidadesProximas.store';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import type { Filtros, DadosDoVinculo } from '@/stores/transferenciasVinculos.store';
import { useTransferenciasVinculosStore } from '@/stores/transferenciasVinculos.store';

import ConsultaGeralVinculacaoRegistro, { VinculacaoFormulario } from './partials/ConsultaGeralVinculacaoRegistro.vue';
import ConsultaGeralVinculacaoSelecao from './partials/ConsultaGeralVinculacaoSelecao.vue';

type Props = {
  dados: ItemConsultaGeralFormatado;
  tipo: 'dotacao' | 'endereco' | 'demanda';
  exibindo: boolean;
};

type Emits = {
  (e: 'fechar'): void;
  (e: 'vinculado'): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

interface Etapa {
  id: string;
  label: string;
  concluido: boolean;
}

type TipoEtapa = 'selecao' | 'registro';

const route = useRoute();
const router = useRouter();

const vinculosStore = useTransferenciasVinculosStore();
const entidadesProximasStore = useEntidadesProximasStore();
const geolocalizadorStore = useGeolocalizadorStore();
const distribuicaoRecursosStore = useDistribuicaoRecursosStore();

const { distribuicaoSelecionadaId } = storeToRefs(entidadesProximasStore);
const { paginacao } = storeToRefs(distribuicaoRecursosStore);
const { selecionado } = storeToRefs(geolocalizadorStore);

const etapaAtual = computed<TipoEtapa>(() => (distribuicaoSelecionadaId.value ? 'registro' : 'selecao'));

const componenteAtual = computed(() => {
  if (etapaAtual.value === 'selecao') {
    return ConsultaGeralVinculacaoSelecao;
  }

  return ConsultaGeralVinculacaoRegistro;
});

const etapas = computed<Etapa[]>(() => [
  {
    id: 'selecao', label: 'Seleção', concluido: true,
  },
  {
    id: 'vincular', label: 'Vincular', concluido: !!distribuicaoSelecionadaId.value,
  },
]);

const entidade = computed<Filtros | void>(() => {
  if (!props.dados) {
    return undefined;
  }

  const filtros: Filtros = {};

  switch (true) {
    case props.dados.modulo === 'demandas':
      filtros.demanda_id = props.dados.id as number;
      break;

    case props.dados.modulo === 'obras':
    case props.dados.modulo === 'projetos':
      filtros.projeto_id = props.dados.id as number;
      break;

    case !!props.dados.atividade_info?.id:
      filtros.atividade_id = props.dados.atividade_info.id;
      break;

    case !!props.dados.iniciativa_info?.id:
      filtros.iniciativa_id = props.dados.iniciativa_info.id;
      break;

    case !!props.dados.meta_info?.id:
      filtros.meta_id = props.dados.meta_info.id;
      break;

    default:
      break;
  }

  return filtros;
});

function iniciarDados() {
  router.replace({ query: { ...route.query, pagina: undefined } });

  paginacao.value = PaginacaoInicial;
}

async function handleRegistrarVinculo({ tipo_vinculo_id, observacao }: VinculacaoFormulario) {
  const mapaTipo = {
    dotacao: 'Dotacao',
    endereco: 'Endereco',
    demanda: 'Demanda',
  };

  try {
    const campoVinculo = mapaTipo[props.tipo];
    if (!campoVinculo) {
      throw new Error(`campo_tipo "${props.tipo}" não válido`);
    }

    let valorVinculo = '';
    if (props.tipo === 'dotacao') {
      if (
        !props.dados.dotacoes_encontradas
        || props.dados.dotacoes_encontradas?.length === 0
      ) {
        throw new Error('Dotação não encontrada');
      }

      valorVinculo = props.dados.dotacoes_encontradas.join('/');
    } else if (props.tipo === 'endereco') {
      if (
        !selecionado.value
        || !selecionado.value.endereco
        || !selecionado.value.endereco.properties?.string_endereco
      ) {
        throw new Error('Endereço não selecionado');
      }

      valorVinculo = selecionado.value.endereco.properties.string_endereco;
    } else if (props.tipo === 'demanda') {
      valorVinculo = props.dados.nome as string || '';
    }

    const dados: DadosDoVinculo = {
      distribuicao_id: distribuicaoSelecionadaId.value,
      tipo_vinculo_id,
      observacao,
      campo_vinculo: campoVinculo,
      valor_vinculo: valorVinculo,
      ...entidade.value,
    };

    if (props.tipo === 'dotacao') {
      dados.orcamento_realizado_id = props.dados.orcamento_realizado_id;
    } else if (props.tipo === 'endereco') {
      dados.geo_localizacao_referencia_id = props.dados.geo_localizacao_referencia_id;
      dados.dados_extra = JSON.stringify(selecionado.value) || undefined;
    }

    await vinculosStore.salvarItem(dados);

    iniciarDados();
    emit('vinculado');
  } catch (e) {
    console.error(e);
  }
}

function fecharVinculacao() {
  iniciarDados();

  emit('fechar');
}

watch(() => props.exibindo, () => {
  distribuicaoSelecionadaId.value = undefined;
  distribuicaoRecursosStore.$reset();
}, { immediate: true });
</script>

<template>
  <SmallModal
    v-if="props.exibindo"
    tamanho-ajustavel
    @close="fecharVinculacao"
  >
    <section>
      <header class="flex center g1 mb2">
        <TituloDePagina class="mb0">
          Vincular à distribuição
        </TituloDePagina>

        <hr class="f1">

        <CheckClose
          apenas-emitir
          @close="fecharVinculacao"
        />
      </header>

      <div class="mb2">
        <p class="t16">
          Selecione a distribuição que deseja vincular a
          <span class="w700 uc">{{ $props.dados.nome }}</span>.
        </p>
      </div>

      <div class="flex mb2">
        <EtapasEmBarras
          :etapas="etapas"
          class="fb50"
        />
      </div>

      <component
        :is="componenteAtual"
        @registrar="handleRegistrarVinculo"
      />
    </section>
  </SmallModal>
</template>
