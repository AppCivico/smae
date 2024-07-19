<script setup>
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { default as SimpleIndicador } from '@/components/metas/SimpleIndicador.vue';
import { AtividadeAtiva } from '@/helpers/AtividadeAtiva';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useAuthStore } from '@/stores/auth.store';
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from './helpers/auxiliaresParaFaroisDeAtraso.ts';

AtividadeAtiva();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
MetasStore.getPdM();

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;

const AtividadesStore = useAtividadesStore();
const { singleAtividade, órgãosResponsáveisNaAtividadeEmFoco } = storeToRefs(AtividadesStore);
if (singleAtividade.value.id != atividade_id) AtividadesStore.getById(iniciativa_id, atividade_id);
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo">
        {{ activePdm.rotulo_atividade }}
      </div>
      <h1
        :class="classeParaFarolDeAtraso(singleAtividade?.cronograma?.atraso_grau)"
        :title="textoParaFarolDeAtraso(singleAtividade?.cronograma?.atraso_grau)"
        style="padding-right: 4px;"
      >
        {{ singleAtividade.codigo }} - {{ singleAtividade.titulo }}
      </h1>
    </div>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="perm?.CadastroMeta?.administrador_no_pdm"
      :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/editar/${atividade_id}`"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>

  <div class="boards">
    <template v-if="singleAtividade.id">
      <div class="flex g2">
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Código
          </div>
          <div class="t13">
            {{ singleAtividade.codigo }}
          </div>
        </div>
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Órgão responsável
          </div>
          <div class="t13">
            {{ órgãosResponsáveisNaAtividadeEmFoco.map(x => x.orgao.descricao).join(', ') }}
          </div>
        </div>
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Órgão participante
          </div>
          <div class="t13">
            {{ singleAtividade.orgaos_participantes.map(x => x.orgao.descricao).join(', ') }}
          </div>
        </div>
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Responsável na coordenadoria de planejamento
          </div>
          <div class="t13">
            {{ singleAtividade.coordenadores_cp.map(x => x.nome_exibicao).join(', ') }}
          </div>
        </div>
      </div>

      <template v-if="singleAtividade.contexto">
        <hr class="mt2 mb2">
        <div>
          <h4>Contexto</h4>
          <div>{{ singleAtividade.contexto }}</div>
        </div>
      </template>

      <template v-if="singleAtividade.complemento">
        <hr class="mt2 mb2">
        <div>
          <h4>
            {{ activePdm.rotulo_complementacao_meta || 'Informações Complementares' }}
          </h4>
          <div>{{ singleAtividade.complemento }}</div>
        </div>
      </template>

      <hr class="mt2 mb2">

      <SimpleIndicador
        :parentlink="parentlink"
        :parent_id="atividade_id"
        parent_field="atividade_id"
      />
    </template>
    <template v-else-if="singleAtividade.loading">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <template v-else-if="singleAtividade.error">
      <div class="error p1">
        <p class="error-msg">
          Error: {{ singleAtividade.error }}
        </p>
      </div>
    </template>
    <template v-else>
      <div class="error p1">
        <p class="error-msg">
          Nenhum item encontrado.
        </p>
      </div>
    </template>
  </div>
</template>
