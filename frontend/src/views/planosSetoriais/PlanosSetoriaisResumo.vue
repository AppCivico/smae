<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import {
  defineOptions,
} from 'vue';
import { planoSetorial as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { useUsersStore } from '@/stores/users.store';

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
      :to="{
        name: `${route.meta.entidadeMãe}.planosSetoriaisEditar`,
        params: { planoSetorialId: emFoco.id }
      }"
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
                  name: `${route.meta.entidadeMãe}.planosSetoriaisResumo`,
                  params: { planoSetorialId: item.id }
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
  </div>
</template>
