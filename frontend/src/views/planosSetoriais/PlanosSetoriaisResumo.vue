<script setup>
import { planoSetorial as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import {
  defineOptions,
} from 'vue';

defineOptions({ inheritAttrs: false });

const route = useRoute();

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
const {
  emFoco,
} = storeToRefs(planosSetoriaisStore);

const ÓrgãosStore = useOrgansStore();
const { órgãosPorId } = storeToRefs(ÓrgãosStore);

const usersStore = useUsersStore();
const { pessoasSimplificadasPorId } = storeToRefs(usersStore);

ÓrgãosStore.getAll();
planosSetoriaisStore.buscarTudo();
usersStore.buscarPessoasSimplificadas();
</script>
<template>
  <header class="flex spacebetween center mb2 g2">
    <TítuloDePágina :ícone="emFoco?.logo" />

    <hr class="f1">

    <router-link
      v-if="emFoco?.id && !emFoco?.arquivado && emFoco?.pode_editar"
      :to="{ name: 'planosSetoriaisEditar', params: { planoSetorialId: emFoco.id } }"
      class="btn big"
    >
      Editar
    </router-link>
  </header>

  <div
    v-if="emFoco"
    class="boards"
  >
    <div class="flex g2 mb2 flexwrap">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.ativo.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.ativo ? 'Sim' : 'Não' }}
        </dd>
      </dl>
    </div>

    <hr class="mb1 f1">

    <div class="flex flexwrap g2 mb2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.descricao.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.descricao || '-' }}
        </dd>
      </dl>
    </div>

    <hr class="mb1 f1">

    <div class="flex g2 mb2 flexwrap">
      <dl class="f1 mb1 fb10em">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_inicio.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_inicio ? dateToField(emFoco.data_inicio) : '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1 fb10em">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_fim.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_fim ? dateToField(emFoco.data_fim) : '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1 fb10em">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_publicacao.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_publicacao ? dateToField(emFoco.data_publicacao) : '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1 fb10em">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.periodo_do_ciclo_participativo_inicio.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.periodo_do_ciclo_participativo_inicio
            ? dateToField(emFoco.periodo_do_ciclo_participativo_inicio)
            : '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1 fb10em">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.periodo_do_ciclo_participativo_fim.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.periodo_do_ciclo_participativo_fim
            ? dateToField(emFoco.periodo_do_ciclo_participativo_fim)
            : '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1 fb5em">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.prefeito.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.prefeito || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1 fb5em">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.orgao_admin_id.spec.label }}
        </dt>
        <dd class="t13">
          <abbr
            v-if="emFoco?.orgao_admin"
            :title="emFoco?.orgao_admin.descricao"
          >
            {{ emFoco?.orgao_admin.sigla || emFoco?.orgao_admin }}
          </abbr>
          <template v-else>
            -
          </template>
        </dd>
      </dl>
    </div>

    <div class="flex flexwrap g2 mb2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.equipe_tecnica.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.equipe_tecnica || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex flexwrap g2 mb2">
      <dl
        v-if="emFoco?.possui_tema"
        class="f1 mb1 fb15em"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          Classificações temáticas
        </dt>
        <dd class="t13 contentStyle">
          <ul>
            <li v-if="emFoco.possui_macro_tema">
              {{ emFoco.rotulo_macro_tema || 'Macro-tema' }}
            </li>
            <li v-if="emFoco.possui_macro_tema && emFoco.possui_tema">
              {{ emFoco.rotulo_tema || 'Tema' }}
            </li>
            <li v-if="emFoco.possui_macro_tema && emFoco.possui_tema && emFoco.possui_sub_tema">
              {{ emFoco.rotulo_sub_tema || 'Sub-tema' }}
            </li>
          </ul>
        </dd>
      </dl>

      <dl
        v-if="emFoco?.possui_contexto_meta"
        class="f1 mb1 fb15em"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          Campos auxiliares
        </dt>
        <dd class="t13 contentStyle">
          <ul>
            <li v-if="emFoco.possui_contexto_meta">
              {{ emFoco.rotulo_contexto_meta || 'Contexto' }}
            </li>
            <li v-if="emFoco.possui_contexto_meta && emFoco.possui_complementacao_meta">
              {{ emFoco.rotulo_complementacao_meta || 'Complementação' }}
            </li>
          </ul>
        </dd>
      </dl>

      <dl
        v-if="emFoco?.possui_iniciativa"
        class="f1 mb1 fb15em"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          Desdobramentos da meta
        </dt>
        <dd class="t13 contentStyle">
          <ul>
            <li v-if="emFoco.possui_iniciativa">
              {{ emFoco.rotulo_iniciativa || 'Iniciativa' }}
            </li>
            <li v-if="emFoco.possui_atividade">
              {{ emFoco.rotulo_atividade || 'Atividade' }}
            </li>
          </ul>
        </dd>
      </dl>

      <dl
        v-if="emFoco?.monitoramento_orcamento"
        class="f1 mb1 fb10em"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.monitoramento_orcamento.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco.nivel_orcamento ? `por ${emFoco.nivel_orcamento}` : 'Sim' }}
        </dd>
      </dl>
    </div>

    <div
      v-if="emFoco?.ps_admin_cp?.participantes?.length
        || emFoco?.ps_tecnico_cp?.participantes?.length
        || emFoco?.ps_ponto_focal?.participantes?.length"
      class="flex flexwrap g2 mb2"
    >
      <dl
        v-if="emFoco?.ps_admin_cp?.participantes?.length"
        class="f1 mb1 fb15em"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['ps_admin_cp.participantes'].spec.label }}
        </dt>
        <dd class="t13 contentStyle">
          <ul>
            <li
              v-for="pessoa in emFoco.ps_admin_cp.participantes"
              :key="pessoa"
            >
              {{ pessoasSimplificadasPorId[pessoa]?.nome_exibicao
                || pessoasSimplificadasPorId[pessoa]
                || pessoa }}
            </li>
          </ul>
        </dd>
      </dl>
      <dl
        v-if="emFoco?.ps_tecnico_cp?.participantes?.length"
        class="f1 mb1 fb15em"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['ps_tecnico_cp.participantes'].spec.label }}
        </dt>
        <dd class="t13 contentStyle">
          <ul>
            <li
              v-for="pessoa in emFoco.ps_tecnico_cp.participantes"
              :key="pessoa"
            >
              {{ pessoasSimplificadasPorId[pessoa]?.nome_exibicao
                || pessoasSimplificadasPorId[pessoa]
                || pessoa }}
            </li>
          </ul>
        </dd>
      </dl>
      <dl
        v-if="emFoco?.ps_ponto_focal?.participantes?.length"
        class="f1 mb1 fb15em"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['ps_ponto_focal.participantes'].spec.label }}
        </dt>
        <dd class="t13 contentStyle">
          <ul>
            <li
              v-for="pessoa in emFoco.ps_ponto_focal.participantes"
              :key="pessoa"
            >
              <template v-if="pessoasSimplificadasPorId[pessoa]">
                {{ pessoasSimplificadasPorId[pessoa].nome_exibicao ||
                  pessoasSimplificadasPorId[pessoa] }}
                <template
                  v-if="órgãosPorId[pessoasSimplificadasPorId[pessoa].orgao_id]?.sigla"
                >
                  (<abbr
                    :title="órgãosPorId[pessoasSimplificadasPorId[pessoa].orgao_id]?.descricao"
                  >
                    {{ órgãosPorId[pessoasSimplificadasPorId[pessoa].orgao_id]?.sigla }}
                  </abbr>)
                </template>
              </template>
              <template v-else>
                {{ pessoa }}
              </template>
            </li>
          </ul>
        </dd>
      </dl>
    </div>

    <div class="flex flexwrap g2 mb2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.legislacao_de_instituicao.spec.label }}
        </dt>
        <dd
          class="t13"
        >
          {{ emFoco?.legislacao_de_instituicao || '-' }}
        </dd>
      </dl>
    </div>

    <div
      v-if="emFoco?.pdm_anteriores?.length"
      class="flex flexwrap g2 mb2"
    >
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.pdm_anteriores.spec.label }}
        </dt>
        <dd class="t13 contentStyle">
          <ul>
            <li
              v-for="item in emFoco?.pdm_anteriores"
              :key="item.id"
            >
              <router-link
                v-if="item.id"
                :to="{
                  name: 'planosSetoriaisResumo', params: {
                    planoSetorialId:
                      item.id
                  }
                }"
              >
                {{ item.nome || item }}
              </router-link>
              <template v-else>
                {{ item }}
              </template>

              <template
                v-if="item.orgao_admin"
              >
                (<abbr
                  :title="item.orgao_admin?.descricao"
                >
                  {{ item.orgao_admin?.sigla || item.orgao_admin }}
                </abbr>)
              </template>
            </li>
          </ul>
        </dd>
      </dl>
    </div>

    <!--
  <div class="flex flexwrap g2 mb2">
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.objeto.spec.label }}
      </dt>
      <dd
        class="t13"
        v-html="emFoco?.objeto || '-'"
      />
    </dl>
  </div>
  <div class="flex flexwrap g2 mb2">
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.publico_alvo.spec.label }}
      </dt>
      <dd
        class="t13"
        v-html="emFoco?.publico_alvo || '-'"
      />
    </dl>
  </div>

  <div class="flex flexwrap g2 mb2">
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.principais_etapas.spec.label }}
      </dt>
      <dd
        class="t13"
        v-html="emFoco?.principais_etapas || '-'"
      />
    </dl>
  </div>

  <div class="flex flexwrap g2 mb2">
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.nao_escopo.spec.label }}
      </dt>
      <dd
        class="t13"
        v-html="emFoco?.nao_escopo || '-'"
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
      :opcoes-do-painel-flutuante="{ permanent: true }"
      :camadas="mapasAgrupados.camadas"
      class="mb1"
      :opções-do-polígono="{
        fill: true,
        opacity: 0.5,
      }"
      zoom="16"
    />
  </div>

  <hr class="mb1 f1">

  <h2>
    {{ schema.fields.fonte_recursos.spec.label }}
  </h2>

  <div class="flex g2 mb2">
    <table class="tablemain">
      <col class="col--minimum">
      <col>
      <col>
      <col>
      <col>
      <thead>
        <tr>
          <th
            class="cell--minimum"
            colspan="2"
          >
            {{ schema.fields.fonte_recursos.innerType.fields.fonte_recurso_cod_sof.spec.label }}
          </th>
          <th class="cell--number cell--minimum">
            {{ schema.fields.fonte_recursos.innerType.fields.fonte_recurso_ano.spec.label }}
          </th>
          <th class="cell--number cell--minimum">
            {{ schema.fields.fonte_recursos.innerType.fields.valor_nominal.spec.label }}
          </th>
          <th class="cell--number cell--minimum">
            {{ schema.fields.fonte_recursos.innerType.fields.valor_percentual.spec.label }}
          </th>
        </tr>
      </thead>

      <tr
        v-for="item in emFoco?.fonte_recursos"
        :key="item.id"
      >
        <td>
          {{ item.fonte_recurso_cod_sof }}
        </td>
        <td
          :title="FontesDeRecursosPorAnoPorCódigo?.[item.fonte_recurso_ano]?.[item.fonte_recurso_cod_sof]?.descricao"
        >
          <template
            v-if="FontesDeRecursosPorAnoPorCódigo?.[item.fonte_recurso_ano]?.[item.fonte_recurso_cod_sof]?.descricao"
          >
            {{
              truncate(
                FontesDeRecursosPorAnoPorCódigo[item.fonte_recurso_ano][item.fonte_recurso_cod_sof].descricao,
                36
              )
            }}
          </template>
        </td>
        <td class="cell--number">
          {{ item.fonte_recurso_ano }}
        </td>
        <td class="cell--number">
          {{ item.valor_nominal ? `R$ ${dinheiro(item.valor_nominal)}` : '-' }}
        </td>
        <td class="cell--number">
          {{ item.valor_percentual ? `${dinheiro(item.valor_percentual)}%` : '-' }}
        </td>
      </tr>
      <tr v-if="!emFoco?.fonte_recursos?.length">
        <td
          colspan="5"
          class="center"
        >
          -
        </td>
      </tr>
    </table>
  </div>

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
      class="flex flexwrap g2 mb2"
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

  <div class="flex g2 mb2 flexwrap">
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.data_inicio.spec.label }}
      </dt>
      <dd class="t13">
        {{ emFoco?.data_inicio ? dateToField(emFoco.data_inicio) : '-' }}
      </dd>
    </dl>
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.data_fim.spec.label }}
      </dt>
      <dd class="t13">
        {{ emFoco?.data_fim ? dateToField(emFoco.data_fim) : '-' }}
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
        {{ emFoco?.tarefa_cronograma?.previsao_custo ? `R$ ${dinheiro(emFoco.tarefa_cronograma.previsao_custo)}` : '-' }}
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
          {{ schema.fields.responsaveis_no_orgao_gestor.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.responsaveis_no_orgao_gestor
            && Array.isArray(emFoco.responsaveis_no_orgao_gestor)
            ? emFoco?.responsaveis_no_orgao_gestor?.map((x) => x.nome_exibicao || x).join(', ')
            : '-' }}
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
          {{ schema.fields.responsavel_id.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.responsavel?.nome_exibicao || emFoco?.responsavel?.id || '-' }}
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
    <div class="flex g2 mb2 flexwrap">
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

  <h2>Controle de versões</h2>

  <div class="flex g2 mb2 flexwrap">
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.versao.spec.label }}
      </dt>
      <dd class="t13">
        {{ emFoco?.versao || '-' }}
      </dd>
    </dl>
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.data_aprovacao.spec.label }}
      </dt>
      <dd class="t13">
        {{ emFoco?.data_aprovacao ? dateToField(emFoco.data_aprovacao) : '-' }}
      </dd>
    </dl>
    <dl class="f1 mb1">
      <dt class="t12 uc w700 mb05 tamarelo">
        {{ schema.fields.data_revisao.spec.label }}
      </dt>
      <dd class="t13">
        {{ emFoco?.data_revisao ? dateToField(emFoco.data_revisao) : '-' }}
      </dd>
    </dl>
  </div>
-->
  </div>
</template>
