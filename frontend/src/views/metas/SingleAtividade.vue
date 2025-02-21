<script setup>
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import SimpleIndicador from '@/components/metas/SimpleIndicador.vue';
import TagsDeMetas from '@/components/metas/TagsDeMetas.vue';
import RelacionamentosComOutrosCompromissos from '@/components/RelacionamentosComOutrosCompromissos.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from './helpers/auxiliaresParaFaroisDeAtraso.ts';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const { meta_id: metaId } = route.params;
const { iniciativa_id: iniciativaId } = route.params;
const { atividade_id: atividadeId } = route.params;

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.getPdM();

const EquipesStore = useEquipesStore();
EquipesStore.buscarTudo();

const parentlink = `${metaId ? `/metas/${metaId}` : ''}${iniciativaId ? `/iniciativas/${iniciativaId}` : ''}${atividadeId ? `/atividades/${atividadeId}` : ''}`;

const AtividadesStore = useAtividadesStore();
const {
  singleAtividade,
  relacionadosAtividade,
} = storeToRefs(AtividadesStore);

async function iniciar() {
  if (singleAtividade.value.id !== atividadeId) {
    await AtividadesStore.getByIdReal(atividadeId);
  }
}

iniciar();
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo mb1">
        {{ activePdm.rotulo_atividade }}
      </div>

      <TítuloDePágina
        :class="classeParaFarolDeAtraso(singleAtividade?.cronograma?.atraso_grau)"
        :title="textoParaFarolDeAtraso(singleAtividade?.cronograma?.atraso_grau)"
        style="padding-right: 4px;"
        :ícone="activePdm?.logo"
      >
        {{ singleAtividade.codigo }} - {{ singleAtividade.titulo }}
      </TítuloDePágina>
    </div>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm',
        'SMAE.GrupoVariavel.participante',
      ])
        && singleMeta?.pode_editar"
      :to="`/metas/${metaId}/iniciativas/${iniciativaId}/atividades/editar/${atividadeId}`"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>
  <div class="boards">
    <template v-if="singleAtividade.id">
      
      <!-- Órgãos -->
      <div class="flex g2 mb2">
        <!-- Responsável -->
        <div class="mr2 f1">
          <div class="t12 uc w700 mb05 tamarelo">
            Órgãos responsáveis
          </div>
          <div class="t13">
            {{
              combinadorDeListas(
                orgaoAtividade = EquipesStore.equipesPorIds(singleAtividade.ps_ponto_focal.equipes).reduce((amount, item) => {
                  amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                  return amount;
                }, []))
            }}     
          </div>
        </div>
        <!-- Fim responsável -->
        <!-- Monitoramento -->
        <div class="mr2 f1">
          <div class="t12 uc w700 mb05 tamarelo">
            Órgãos monitoramento
          </div>
          <div class="t13">
            {{
              combinadorDeListas(
                orgaoAtividade = EquipesStore.equipesPorIds(singleAtividade.ps_tecnico_cp.equipes).reduce((amount, item) => {
                  amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                  return amount;
                }, []))
            }}     
          </div>
        </div> 
        <!-- Fim monitoramento -->
      </div>
      <!-- Fim de órgãos -->
      <!-- Equipes -->
      <div class="flex g2 mb2">
        <!-- Responsável -->
          <div
            v-if="EquipesStore.equipesPorIds(singleAtividade.ps_ponto_focal.equipes).length"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Equipes responsáveis
            </div>
            <div class="t13">
              {{ combinadorDeListas(
                EquipesStore.equipesPorIds(singleAtividade.ps_ponto_focal.equipes),
                false,
                'titulo',
              ) }}
            </div>
          </div>
          <!-- Fim responsável -->
          <!-- Técnica -->
          <div
            v-if="EquipesStore.equipesPorIds(singleAtividade.ps_tecnico_cp.equipes).length"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Equipe técnica de monitoramento
            </div>
            <div class="t13">
              {{ combinadorDeListas(
                EquipesStore.equipesPorIds(singleAtividade.ps_tecnico_cp.equipes),
                false,
                'titulo',
              ) }}
            </div>
          </div>
        <!-- Fim de técnica -->
      </div>
      <!-- Fim equipes -->
      <div v-if="singleAtividade?.tags.length">
        <hr class="mt2 mb2">
        <TagsDeMetas :lista-de-tags="singleAtividade.tags" />
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
        :parent_id="atividadeId"
        parent_field="atividade_id"
      />

      <RelacionamentosComOutrosCompromissos
        class="mt2"
        :atividade-id="singleAtividade.id"
        :pdm-id="activePdm.id"
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
