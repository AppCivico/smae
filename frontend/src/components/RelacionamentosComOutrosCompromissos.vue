<template>
  <pre v-ScrollLockDebug>$props.params:{{ $props.params }}</pre>
  <LoadingComponent v-if="carregando">
    Consultando relacionamentos...
  </LoadingComponent>
  <ErrorComponent :erro="erro" />
  <div
    v-if="listaPdmPsComOrgaosCombinados.length
      || relacionamentos?.obras?.length
      || relacionamentos?.projetos?.length"
    v-bind="$attrs"
  >
    <!-- TO-DO: Mover para um componente filho -->
    <div
      v-if="relacionamentos?.projetos?.length"
      class="mb2"
    >
      <h2 id="titulo-projetos-associados">
        Projetos associados
      </h2>

      <RolagemHorizontal aria-labelledby="titulo-projetos-associados">
        <table class="tablemain">
          <colgroup>
            <col>
            <col>
            <col>
            <col>
          </colgroup>
          <thead>
            <tr>
              <th>Portfólio </th>
              <th>Código</th>
              <th>Nome</th>
              <th>Etapa</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(projeto, index) in relacionamentos.projetos"
              :key="index"
            >
              <td>
                {{ projeto.portfolio?.titulo || '-' }}
              </td>
              <td>
                {{ projeto.codigo || '-' }}
              </td>
              <th>
                {{ projeto.nome || '-' }}
              </th>
              <td>
                {{ projeto.projeto_etapa?.descricao || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </RolagemHorizontal>
    </div>

    <!-- TO-DO: Mover para um componente filho -->
    <div
      v-if="relacionamentos?.obras?.length"
      class="mb2"
    >
      <h2 id="titulo-obras-associadas">
        Obras associadas
      </h2>

      <RolagemHorizontal aria-labelledby="titulo-obras-associadas">
        <table class="tablemain">
          <colgroup>
            <col>
            <col>
            <col>
            <col>
            <col>
            <col>
            <col>
          </colgroup>
          <thead>
            <tr>
              <th>
                Código
              </th>
              <th>
                Nome
              </th>
              <th>
                Tipo obra/intervenção
              </th>
              <th>
                Subprefeitura
              </th>
              <th>
                Equipamento
              </th>
              <th>
                Status
              </th>
              <th>
                Percentual concluído
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(obra, index) in relacionamentos.obras"
              :key="index"
            >
              <td>
                {{ obra.codigo }}
              </td>
              <th>
                {{ obra.nome }}
              </th>
              <td>
                {{ obra.tipo_intervencao?.nome || '-' }}
              </td>
              <td>
                {{ combinadorDeListas(obra.subprefeituras, ', ', 'descricao') ||
                  '-' }}
              </td>
              <td>
                {{ obra.equipamento?.nome || '-' }}
              </td>
              <td>
                {{ statusObras[obra.status as keyof typeof statusObras].nome || '-' }}
              </td>
              <td>
                {{ obra.percentual_concluido || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </RolagemHorizontal>
    </div>

    <!-- TO-DO: Mover para um componente filho -->
    <div
      v-if="listaPdmPsComOrgaosCombinados.length"
      class="mb2"
    >
      <h2 id="titulo-outros-relacionamentos">
        Relacionamentos com outros compromissos
      </h2>

      <RolagemHorizontal aria-labelledby="titulo-outros-relacionamentos">
        <table class="tablemain">
          <col>
          <col>
          <col>
          <col>
          <col>
          <col>
          <thead>
            <tr>
              <th>
                Tipo
              </th>
              <th>
                <abbr title="Programa de Metas">PdM</abbr> / Plano Setorial
              </th>
              <th>Órgãos</th>
              <th>Meta</th>
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(relacionamento, idx) in listaPdmPsComOrgaosCombinados"
              :key="idx"
            >
              <td>
                <abbr
                  v-if="'tipo' in relacionamento
                    && tiposDePlanos[relacionamento.tipo as keyof typeof tiposDePlanos]"
                  :title="tiposDePlanos[relacionamento.tipo as keyof typeof tiposDePlanos].nome"
                >
                  {{ relacionamento.tipo }}
                </abbr>
                <template v-else>
                  {{ relacionamento.tipo || '-' }}
                </template>
              </td>
              <th>
                <component
                  :is="relacionamento.dentroDePlanoSetorial && 'pdm_id' in relacionamento
                    ? SmaeLink
                    : 'span'"
                  :to="{
                    name: '.planosSetoriaisResumo',
                    params: { planoSetorialId: relacionamento.pdm_id }
                  }"
                >
                  {{ relacionamento.pdm_nome }}
                </component>
              </th>
              <td>{{ combinadorDeListas(relacionamento.orgaos, ', ', 'sigla') }}</td>
              <td
                :title="'meta_titulo' in relacionamento
                  && relacionamento.meta_titulo.length > 64
                  ? relacionamento.meta_titulo
                  : undefined"
              >
                <component
                  :is="relacionamento.dentroDePlanoSetorial
                    ? SmaeLink
                    : 'span'"
                  :to="{
                    name: '.meta',
                    params: {
                      meta_id: relacionamento.meta_id,
                      planoSetorialId: relacionamento.pdm_id
                    }
                  }"
                >
                  <em v-if="'meta_codigo' in relacionamento">
                    {{ relacionamento.meta_codigo }} -
                  </em>
                  {{ 'meta_titulo' in relacionamento
                    ? truncate(relacionamento.meta_titulo, 64)
                    : '-' }}
                </component>
              </td>
              <td
                :title="'iniciativa_descricao' in relacionamento
                  && relacionamento.iniciativa_descricao
                  && relacionamento.iniciativa_descricao.length > 36
                  ? relacionamento.iniciativa_descricao
                  : undefined"
              >
                <component
                  :is="relacionamento.dentroDePlanoSetorial && 'iniciativa_id' in relacionamento
                    ? SmaeLink
                    : 'span'"
                  :to="{
                    name: 'planoSetorial.resumoDeIniciativa',
                    params: {
                      planoSetorialId: relacionamento.pdm_id,
                      meta_id: relacionamento.meta_id,
                      iniciativa_id: relacionamento.iniciativa_id
                    }
                  }"
                >
                  <strong v-if="'iniciativa_descricao' in relacionamento">
                    {{ relacionamento.pdm_rotulo_iniciativa || 'Iniciativa' }}:
                  </strong>
                  <em v-if="'iniciativa_codigo' in relacionamento">
                    {{ relacionamento.iniciativa_codigo }} -
                  </em>
                  {{ 'iniciativa_descricao' in relacionamento
                    ? truncate(relacionamento.iniciativa_descricao, 36)
                    : '-' }}
                </component>
              </td>
              <td
                :title="'atividade_descricao' in relacionamento
                  && relacionamento.atividade_descricao
                  && relacionamento.atividade_descricao.length > 36
                  ? relacionamento.atividade_descricao
                  : undefined"
              >
                <component
                  :is="relacionamento.dentroDePlanoSetorial && 'atividade_id' in relacionamento
                    ? SmaeLink
                    : 'span'"
                  :to="{
                    name: 'planoSetorial.resumoDeAtividade',
                    params: {
                      planoSetorialId: relacionamento.pdm_id,
                      meta_id: relacionamento.meta_id,
                      iniciativa_id: relacionamento.iniciativa_id,
                      atividade_id: relacionamento.atividade_id
                    }
                  }"
                >
                  <strong v-if="'atividade_descricao' in relacionamento">
                    {{ relacionamento.pdm_rotulo_atividade || 'Atividade' }}:
                  </strong>
                  <em v-if="'atividade_codigo' in relacionamento">
                    {{ relacionamento.atividade_codigo }} -
                  </em>
                  {{ 'atividade_descricao' in relacionamento
                    ? truncate(relacionamento.atividade_descricao, 36)
                    : '-' }}
                </component>
              </td>
            </tr>
          </tbody>
        </table>
      </RolagemHorizontal>
    </div>
  </div>
</template>
<script lang="ts" setup>
import SmaeLink from '@/components/SmaeLink.vue';
import statusObras from '@/consts/statusObras';
import tiposDePlanos from '@/consts/tiposDePlanos';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import requestS from '@/helpers/requestS';
import truncate from '@/helpers/texto/truncate';
import type { IdSigla } from '@back/common/dto/IdSigla.dto.ts';
import type {
  MetaPdmDto,
  RelacionadosDTO,
} from '@back/meta/entities/meta.entity.ts';
import { uniqBy } from 'lodash';
import {
  computed, defineProps, ref, watchEffect,
} from 'vue';
import type { RouteMeta } from 'vue-router';
import { useRoute } from 'vue-router';
import RolagemHorizontal from './rolagem/RolagemHorizontal.vue';

defineOptions({
  inheritAttrs: false,
});

type RelacionamentoComOrgaosCombinados = MetaPdmDto & {
  orgaos: IdSigla[];
  dentroDePlanoSetorial: boolean;
};

const props = defineProps({
  params: {
    type: Object as () => Record<string, unknown>,
    default: () => ({}),
  },
  // Fornecendo os parâmetros um a um para evitar múltiplas requisições
  // enquanto o Vue avalia as propriedades de um objeto
  pdmId: {
    type: [Number, String],
    required: true,
    validator: (value: number | string, otherProps) => !!value
    && (
      !!otherProps.iniciativaId
      || !!otherProps.atividadeId
      || !!otherProps.metaId
    ),
  },
  metaId: {
    type: [Number, String],
    default: 0,
    validator: (value: number | string, otherProps) => !!value
    || !!otherProps.iniciativaId
    || !!otherProps.atividadeId,
  },
  iniciativaId: {
    type: [Number, String],
    default: 0,
    validator: (value: number | string, otherProps) => !!value
    || !!otherProps.metaId
    || !!otherProps.atividadeId,
  },
  atividadeId: {
    type: [Number, String],
    default: 0,
    validator: (value: number | string, otherProps) => !!value
    || !!otherProps.metaId
    || !!otherProps.iniciativaId,
  },
});

const route = useRoute();

const relacionamentos = ref<RelacionadosDTO | null>(null);
const erro = ref();
const carregando = ref(false);

function combinadorDeOrgaos(relacionamento: MetaPdmDto): IdSigla[] {
  let todosOsOrgaos: IdSigla[] = [];

  if ('meta_orgaos' in relacionamento && Array.isArray(relacionamento.meta_orgaos)) {
    todosOsOrgaos = todosOsOrgaos.concat(relacionamento.meta_orgaos);
  }

  if ('iniciativa_orgaos' in relacionamento && Array.isArray(relacionamento.iniciativa_orgaos)) {
    todosOsOrgaos = todosOsOrgaos.concat(relacionamento.iniciativa_orgaos);
  }

  if ('atividade_orgaos' in relacionamento && Array.isArray(relacionamento.atividade_orgaos)) {
    todosOsOrgaos = todosOsOrgaos.concat(relacionamento.atividade_orgaos);
  }

  return todosOsOrgaos.length
    ? uniqBy(todosOsOrgaos, 'id')
    : todosOsOrgaos;
}

function caminhoParaApi(rotaMeta: RouteMeta) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return 'meta';
    case 'planoSetorial':
    case 'programaDeMetas':
      return 'plano-setorial-meta';
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

// eslint-disable-next-line max-len
const listaPdmPsComOrgaosCombinados = computed<RelacionamentoComOrgaosCombinados[]>(() => (relacionamentos.value?.metas
  ? relacionamentos.value?.metas.map((relacionamento) => ({
    ...relacionamento,
    orgaos: combinadorDeOrgaos(relacionamento),
    dentroDePlanoSetorial: 'tipo' in relacionamento
      && relacionamento.tipo === 'PS'
      && route.meta.entidadeMãe === 'planoSetorial',
  }))
  : []));

watchEffect(async () => {
  try {
    if (props.pdmId) {
      if (props.metaId || props.iniciativaId || props.atividadeId) {
        carregando.value = true;
        console.debug('Consultando relacionamentos...');
        const response = await requestS.get(`${import.meta.env.VITE_API_URL}/${caminhoParaApi(route.meta)}/relacionados/`, {
          pdm_id: props.pdmId,
          meta_id: props.metaId,
          iniciativa_id: props.iniciativaId,
          atividade_id: props.atividadeId,
        }) as RelacionadosDTO;
        console.debug('Relacionamentos:', response);
        relacionamentos.value = response;
      }
    }
  } catch (error) {
    erro.value = error;
    console.error(erro);
  } finally {
    carregando.value = false;
  }
});
</script>
