<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import ListaAninhada from '@/components/ListaAninhada.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import { obra as schema } from '@/consts/formSchemas';
import statusesObras from '@/consts/statusObras';
import createDataTree from '@/helpers/createDataTree';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import subtractDates from '@/helpers/subtractDates';
import { useObrasStore } from '@/stores/obras.store';
import { useOrgansStore } from '@/stores/organs.store';

const ÓrgãosStore = useOrgansStore();
const obrasStore = useObrasStore();

const { organs, órgãosPorId } = storeToRefs(ÓrgãosStore);
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(obrasStore);

const equipeAgrupadaPorÓrgão = computed(() => (Array.isArray(emFoco.value?.equipe)
  ? emFoco.value.equipe.reduce((acc, cur) => {
    if (!acc[`_${cur.orgao_id}`]) {
      acc[`_${cur.orgao_id}`] = { id: cur.orgao_id, pessoas: [] };
    }
    acc[`_${cur.orgao_id}`].pessoas.push(cur.pessoa);

    return acc;
  }, {})
  : {}));

const mapasAgrupados = computed(() => (Array.isArray(emFoco.value?.geolocalizacao)
  ? emFoco.value.geolocalizacao.reduce((acc, cur) => {
    if (!acc?.endereços) {
      acc.endereços = [];
    }
    acc.endereços.push(cur.endereco);

    if (!acc?.camadas) {
      acc.camadas = [];
    }
    acc.camadas = acc.camadas.concat(cur.camadas);

    return acc;
  }, {})
  : {}));

const exibeBlocoHabitacional = computed(() => {
  const foco = emFoco.value;
  return foco?.mdo_n_familias_beneficiadas
      || foco?.mdo_n_unidades_habitacionais
      || foco?.mdo_n_unidades_atendidas
      || foco?.programa?.nome
      || foco?.programa;
});

defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
});

if (!Array.isArray(organs.value) || !organs.value.length) {
  ÓrgãosStore.getAll();
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ emFoco?.nome }}</h1>
    <hr class="ml2 f1">
    <MenuDeMudançaDeStatusDeProjeto />

    <router-link
      v-if="emFoco?.id && !emFoco?.arquivado && !emFoco?.permissoes?.apenas_leitura"
      :to="{ name: 'obrasEditar', params: { obraId: emFoco.id } }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <div
    v-if="emFoco"
    class="boards"
  >
    <dl class="flex g2 mb1 flexwrap">
      <div
        v-if="emFoco?.codigo"
        class="f1 mb1"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.codigo.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.codigo }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.status.spec.label }}
        </dt>
        <dd class="t13">
          {{ statusesObras[emFoco?.status]?.nome || emFoco?.status }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.tags.spec.label }}
        </dt>
        <dd class="t13">
          <ul class="listaComoTexto">
            <li v-if="!emFoco?.tags?.length">
              {{ '-' }}
            </li>
            <li
              v-for="item in emFoco?.tags"
              :key="item.id"
            >
              {{ item.descricao }}
            </li>
          </ul>
        </dd>
      </div>
    </dl>

    <hr class="mb1 f1">

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.nome.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.nome || '-' }}
        </dd>
      </dl>
    </div>

    <hr class="mb1 f1">
    <dl class="flex g2 flexwrap">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.grupo_tematico.spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.grupo_tematico?.nome || '-'"
        />
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.tipo_intervencao.spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.tipo_intervencao?.nome || '-'"
        />
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.equipamento.spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.equipamento?.nome || '-'"
        />
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.empreendimento.spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.empreendimento?.identificador || '-'"
        />
      </div>
    </dl>
    <hr class="mb1 f1">
    <dl class="flex g2 flexwrap">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.orgao_origem_id.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.orgao_origem.sigla }} - {{ emFoco?.orgao_origem.descricao }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.orgao_executor_id.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.orgao_executor?.sigla }} - {{ emFoco?.orgao_executor?.descricao }}
        </dd>
      </div>
    </dl>

    <div class="mb2">
      <h2>{{ schema.fields.origens_extra.spec.label }}</h2>

      <dl
        v-for="origem in emFoco?.origens_extra"
        :key="origem.id"
        class="mb2"
      >
        <div class="mb1">
          <dt
            v-if="origem.pdm"
            class="t12 uc w700 mb05 tamarelo"
          >
            PdM/Plano Setorial
          </dt>

          <dd
            v-if="origem?.pdm?.nome"
            class="t13"
          >
            {{ origem.pdm?.nome }}
          </dd>
          <dd
            v-else
            class="t13"
          >
            {{ origem.pdm }}
          </dd>
        </div>

        <div class="mb1">
          <dt
            v-if="origem.meta"
            class="t12 uc w700 mb05 tamarelo"
          >
            {{ schema.fields.origens_extra.innerType?.fields.meta_id.spec.label }}
          </dt>

          <dd
            v-if="origem?.meta?.codigo && origem?.meta?.titulo"
            class="t13"
          >
            {{ origem.meta?.codigo }} - {{ origem?.meta?.titulo }}
          </dd>
          <dd
            v-else
            class="t13"
          >
            {{ origem.meta }}
          </dd>
        </div>

        <div
          v-if="origem?.iniciativa"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.origens_extra.innerType?.fields.iniciativa_id.spec.label }}
          </dt>
          <dd
            v-if="origem?.iniciativa?.codigo && origem?.iniciativa?.titulo"
            class="t13"
          >
            {{ origem.iniciativa?.codigo }} - {{ origem?.iniciativa?.titulo }}
          </dd>
          <dd
            v-else
            class="t13"
          >
            {{ origem.iniciativa }}
          </dd>
        </div>

        <div
          v-if="origem?.atividade"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.origens_extra.innerType?.fields.atividade_id.spec.label }}
          </dt>
          <dd
            v-if="origem?.atividade?.codigo && origem?.atividade?.titulo"
            class="t13"
          >
            {{ origem.atividade?.codigo }} - {{ origem?.atividade?.titulo }}
          </dd>
          <dd
            v-else
            class="t13"
          >
            {{ origem.atividade }}
          </dd>
        </div>
      </dl>
    </div>

    <hr class="mb1 f1">
    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.projeto_etapa.spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.projeto_etapa?.descricao || '-'"
        />
      </dl>
    </div>

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.mdo_detalhamento.spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.mdo_detalhamento|| '-'"
        />
      </dl>
    </div>

    <div v-if="exibeBlocoHabitacional">
      <hr class="mb1 f1">
      <dl class="flex g2 flexwrap">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.mdo_n_familias_beneficiadas.spec.label }}
          </dt>
          <dd
            class="t13"
            v-html="emFoco?.mdo_n_familias_beneficiadas || '-'"
          />
        </div>

        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.mdo_n_unidades_habitacionais.spec.label }}
          </dt>
          <dd
            class="t13"
            v-html="emFoco?.mdo_n_unidades_habitacionais || '-'"
          />
        </div>
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.mdo_n_unidades_atendidas.spec.label }}
          </dt>
          <dd
            class="t13"
            v-html="emFoco?.mdo_n_unidades_atendidas || '-'"
          />
        </div>
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.programa_id.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.programa?.nome || emFoco?.programa || '-' }}
          </dd>
        </div>
      </dl>

      <hr class="mb1 f1">
    </div>

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.regioes.spec.label }}
        </dt>

        <dd class="t13 contentStyle">
          <ListaAninhada
            v-if="emFoco?.regioes?.length"
            v-slot="{ item, nivel }"
            :lista="createDataTree(emFoco?.regioes, {
              parentPropertyName: 'parente_id',
              childrenPropertyName: 'filhas'
            })"
            nome-das-filhas="filhas"
            nome-do-texto="descricao"
          >
            <strong v-if="nivel === 1">
              {{ item.descricao }}
            </strong>
            <template v-else>
              {{ item.descricao }}
            </template>
          </ListaAninhada>
        </dd>
      </dl>
    </div>

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.mdo_observacoes.spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.mdo_observacoes || '-'"
        />
      </dl>
    </div>

    <hr
      v-if="emFoco?.geolocalizacao?.length"
      class="mb1 f1"
    >

    <div
      v-if="emFoco?.geolocalizacao?.length"
      class="mb1"
    >
      <h3 class="label mt2 mb1legend">
        Localização
      </h3>

      <MapaExibir
        :geo-json="mapasAgrupados.endereços"
        :camadas="mapasAgrupados.camadas"
        class="mb1"
        :opcoes-do-painel-flutuante="{ permanent: true }"
        :opções-do-polígono="{
          fill: true,
          opacity: 0.5,
        }"
        zoom="16"
      />
    </div>

    <hr class="mb1 f1">

    <div>
      <h2>{{ schema.fields.origem_tipo.spec.label }}</h2>

      <dl
        v-if="emFoco?.origem_tipo !== 'PdmSistema'"
        class="mb1"
      >
        <dt
          v-if="emFoco?.meta_codigo"
          class="t12 uc w700 mb05 tamarelo"
        >
          Meta {{ emFoco.meta_codigo }} do PdM Antigo
        </dt>

        <dt
          v-else
          class="t12 uc w700 mb05 tamarelo"
        >
          Fora do PdM
        </dt>

        <dd class="t13">
          {{ emFoco?.origem_outro || '-' }}
        </dd>
      </dl>

      <div
        v-else
        class="flex g2"
      >
        <dl
          v-if="emFoco?.meta_id"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 tamarelo">
            Meta Vinculada
          </dt>
          <dd
            v-if="emFoco?.meta?.codigo && emFoco?.meta?.titulo"
            class="t13"
          >
            {{ emFoco.meta?.codigo }} - {{ emFoco?.meta?.titulo }}
          </dd>
          <dd
            v-else
            class="t13"
          >
            {{ emFoco.meta_id }}
          </dd>
        </dl>

        <dl
          v-if="emFoco?.iniciativa_id"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 tamarelo">
            Iniciativa vinculada
          </dt>
          <dd
            v-if="emFoco?.iniciativa?.codigo && emFoco?.iniciativa?.titulo"
            class="t13"
          >
            {{ emFoco.iniciativa?.codigo }} - {{ emFoco?.iniciativa?.titulo }}
          </dd>
          <dd
            v-else
            class="t13"
          >
            {{ emFoco.iniciativa_id }}
          </dd>
        </dl>
        <dl
          v-if="emFoco?.atividade_id"
          class="f1 mb1"
        >
          <dt class="t12 uc w700 mb05 tamarelo">
            Atividade vinculada
          </dt>
          <dd
            v-if="emFoco?.atividade?.codigo && emFoco?.atividade?.titulo"
            class="t13"
          >
            {{ emFoco.atividade?.codigo }} - {{ emFoco?.atividade?.titulo }}
          </dd>
          <dd
            v-else
            class="t13"
          >
            {{ emFoco.atividade_id }}
          </dd>
        </dl>
      </div>
    </div>

    <hr class="mt2 mb2 f1">

    <div class="flex g2 mb1 flexwrap">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.previsao_inicio.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.previsao_inicio ? dateToField(emFoco.previsao_inicio) : '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.previsao_termino.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.previsao_termino ? dateToField(emFoco.previsao_termino) : '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.mdo_previsao_inauguracao.spec.label }}
        </dt>
        <dd class="t13">
          {{
            emFoco?.mdo_previsao_inauguracao ?
              dateToField(emFoco.mdo_previsao_inauguracao) : '-'
          }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.tolerancia_atraso.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.tolerancia_atraso || '-' }}
        </dd>
      </dl>
      <dl class="f2 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.previsao_custo.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.previsao_custo ? `R$ ${dinheiro(emFoco.previsao_custo)}` : '-' }}
        </dd>
      </dl>
      <dl class="f2 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Custo total planejado
        </dt>
        <dd class="t13">
          {{
            emFoco?.tarefa_cronograma?.previsao_custo ?
              `R$ ${dinheiro(emFoco.tarefa_cronograma.previsao_custo)}` : '-'
          }}
        </dd>
      </dl>
    </div>

    <hr class="mb1 f1">

    <div>
      <h2>
        Órgãos
      </h2>
      <dl class="flex g2 flexwrap">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.orgao_gestor_id.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.orgao_gestor.sigla }} - {{ emFoco?.orgao_gestor.descricao }}
          </dd>
        </div>
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.secretario_executivo.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.secretario_executivo || '-' }}
          </dd>
        </div>
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.responsaveis_no_orgao_gestor.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.responsaveis_no_orgao_gestor
              && Array.isArray(emFoco.responsaveis_no_orgao_gestor)
              ? emFoco?.responsaveis_no_orgao_gestor?.map((x) => x.nome_exibicao || x).join(', ')
              : '-' }}
          </dd>
        </div>
      </dl>
      <dl class="flex g2 flexwrap">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.orgao_responsavel_id.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.orgao_responsavel?.sigla }} - {{ emFoco?.orgao_responsavel?.descricao }}
          </dd>
        </div>
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.secretario_responsavel.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.secretario_responsavel || '-' }}
          </dd>
        </div>
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.responsavel_id.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.responsavel?.nome_exibicao || emFoco?.responsavel?.id || '-' }}
          </dd>
        </div>
      </dl>

      <dl class="flex g2 flexwrap">
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.orgao_colaborador_id.spec.label }}
          </dt>
          <dd class="t13">
            {{ emFoco?.orgao_colaborador?.sigla }} - {{ emFoco?.orgao_colaborador?.descricao }}
          </dd>
        </div>
        <div class="f1 mb1">
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ schema.fields.colaboradores_no_orgao.spec.label }}
          </dt>
          <dd class="t13">
            <ul class="lista-com-ponto">
              <li v-if="!emFoco?.colaboradores_no_orgao?.length">
                {{ '-' }}
              </li>
              <li
                v-for="item in emFoco?.colaboradores_no_orgao"
                :key="item.id"
              >
                {{ item.nome_exibicao }}
              </li>
            </ul>
          </dd>
        </div>
        <div class="f1 mb1">
          <!-- aqui só pra ajustar o layout -->
        </div>
      </dl>

      <dl
        v-if="emFoco?.orgaos_participantes?.length"
        class="f1 mb1 fb100"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.orgaos_participantes.spec.label }}
        </dt>
        <dd class="t13">
          <template
            v-for="item in emFoco?.orgaos_participantes"
            :key="item.id"
          >
            {{ item.sigla }} - {{ item.descricao }},
          </template>
        </dd>
      </dl>

      <h2>{{ schema.fields.grupo_portfolio.spec.label }}</h2>

      <ul class="lista-com-ponto">
        <li
          v-for="grupoPorfolio in emFoco?.grupo_portfolio"
          :key="grupoPorfolio.id"
          class="mb1"
        >
          <span class="t13">{{ grupoPorfolio.titulo }}</span>
        </li>
      </ul>
    </div>

    <hr
      v-if="emFoco.equipe?.length"
      class="mb1 f1"
    >

    <div
      v-if="emFoco.equipe?.length"
      class="mb1"
    >
      <h2>
        {{ schema.fields.equipe.spec.label }}
      </h2>
      <div class="flex g2 mb1 flexwrap">
        <dl
          v-for="(órgão, key) in equipeAgrupadaPorÓrgão"
          :key="key"
          class="f1"
        >
          <dt class="t12 uc w700 mb05 tamarelo">
            {{ órgãosPorId[órgão.id]
              ? `${órgãosPorId[órgão.id].sigla} - ${órgãosPorId[órgão.id].descricao}`
              : órgão.id }}
          </dt>
          <dd class="t13">
            <ul class="listaComoTexto">
              <li v-if="!órgão.pessoas?.length">
                {{ '-' }}
              </li>
              <li
                v-for="item in órgão.pessoas"
                :key="item.id"
              >
                {{ item.nome_exibicao }}
              </li>
            </ul>
          </dd>
        </dl>
      </div>
    </div>

    <hr class="mb1 f1">
  </div>

  <template v-if="emFoco?.status === 'Fechado'">
    <hr class="mb1 f1">

    <h2>
      Encerramento do projeto
    </h2>

    <table class="tablemain">
      <colgroup>
        <col>
        <col>
        <col>
        <col>
      </colgroup>

      <thead>
        <tr class="pl3 center mb05 tc300 w700 t12 uc">
          <th />
          <th class="tr">
            Planejado
          </th>
          <th class="tr">
            Realizado
          </th>
          <th class="tr">
            Desvio
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <th>
            Data de início
          </th>
          <td class="tr">
            {{ emFoco?.previsao_inicio ? dateToField(emFoco.previsao_inicio) : '-' }}
          </td>
          <td class="tr">
            {{ emFoco?.realizado_inicio ? dateToField(emFoco.realizado_inicio) : '-' }}
          </td>
          <td class="cell--number">
            {{ emFoco?.realizado_inicio && emFoco?.previsao_inicio
              ? `${subtractDates(emFoco.realizado_inicio, emFoco.previsao_inicio)} dias`
              : '-' }}
          </td>
        </tr>

        <tr>
          <th>
            Data de término
          </th>
          <td class="tr">
            {{ emFoco?.previsao_termino ? dateToField(emFoco.previsao_termino) : '-' }}
          </td>
          <td class="tr">
            {{ emFoco?.realizado_termino ? dateToField(emFoco.realizado_termino) : '-' }}
          </td>
          <td class="cell--number">
            {{ emFoco?.realizado_termino && emFoco?.previsao_termino
              ? `${subtractDates(emFoco.realizado_termino, emFoco.previsao_termino)} dias`
              : '-' }}
          </td>
        </tr>

        <tr>
          <th>
            Duração
          </th>
          <td class="cell--number">
            {{ emFoco?.previsao_duracao ? `${emFoco.previsao_duracao} dias` : '-' }}
          </td>
          <td class="cell--number">
            {{ emFoco?.realizado_duracao ? `${emFoco.realizado_duracao} dias` : '-' }}
          </td>
          <td class="cell--number">
            {{ emFoco?.realizado_duracao && emFoco?.previsao_duracao
              ? `${emFoco.realizado_duracao - emFoco.previsao_duracao} dias`
              : '-' }}
          </td>
        </tr>

        <tr>
          <th>
            Custo
          </th>
          <td class="cell--number">
            {{ emFoco?.previsao_custo ? `R$ ${dinheiro(emFoco.previsao_custo)}` : '-' }}
          </td>
          <td class="cell--number">
            {{ emFoco?.realizado_custo ? `R$ ${dinheiro(emFoco.realizado_custo)}` : '-' }}
          </td>
          <td class="cell--number">
            {{ emFoco?.realizado_custo && emFoco?.previsao_custo
              ? `R$ ${dinheiro(emFoco.realizado_custo - emFoco.previsao_custo)}`
              : '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </template>

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
