<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import EtapasEmBarras from '@/components/EtapasEmBarras.vue';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';
import { useTransferenciasVinculosStore, type Filtros } from '@/stores/transferenciasVinculos.store';

import ConsultaGeralVinculacaoRegistro, { VinculacaoFormulario } from './partials/ConsultaGeralVinculacaoRegistro.vue';
import ConsultaGeralVinculacaoSelecao from './partials/ConsultaGeralVinculacaoSelecao.vue';

type Props = {
  dados: Record<string, unknown>,
  tipo: 'dotacao' | 'endereco'
};

type Emits = {
  (e: 'fechar'): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

interface Etapa {
  id: string;
  label: string;
  concluido: boolean;
}

type TipoEtapa = 'selecao' | 'registro';

const vinculosStore = useTransferenciasVinculosStore();
const entidadesProximasStore = useEntidadesProximasStore();
const geolocalizadorStore = useGeolocalizadorStore();
const { distribuicaoSelecionadaId } = storeToRefs(entidadesProximasStore);
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

async function handleRegistrarVinculo({ tipo_vinculo_id, observacao }: VinculacaoFormulario) {
  const mapaTipo = {
    dotacao: 'Dotacao',
    endereco: 'Endereco',
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
        throw new Error('Dotação não encontrada`');
      }

      valorVinculo = props.dados.dotacoes_encontradas.join('/');
    } else if (props.tipo === 'endereco') {
      if (!selecionado.value) {
        throw new Error('Endereço não selecionado');
      }

      valorVinculo = selecionado.value.endereco.properties.string_endereco;
    }

    const dados = {
      distribuicao_id: distribuicaoSelecionadaId.value,
      tipo_vinculo_id,
      observacao,
      campo_vinculo: campoVinculo,
      valor_vinculo: valorVinculo,
      ...entidade.value,
    };

    await vinculosStore.salvarItem(dados);
    emit('fechar');
  } catch (e) {
    console.error(e);
  }
}
</script>

<template>
  <CabecalhoDePagina />

  <section>
    <div class="mb2">
      <p class="t16">
        Selecione à distribuição que deseja vincular a
        <span class="w700 uc">nome da meta/obra/plano/projeto</span>.
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
</template>
