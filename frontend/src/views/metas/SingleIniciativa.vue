<script setup>
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import SimpleIndicador from '@/components/metas/SimpleIndicador.vue';
import TagsDeMetas from '@/components/metas/TagsDeMetas.vue';
import RelacionamentosComOutrosCompromissos from '@/components/RelacionamentosComOutrosCompromissos.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import rolarTelaPara from '@/helpers/rolarTelaPara.ts';
import {
  useAtividadesStore, useAuthStore, useIniciativasStore, useMetasStore,
} from '@/stores';
import { useAlertStore } from '@/stores/alert.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { storeToRefs } from 'pinia';
import { nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from './helpers/auxiliaresParaFaroisDeAtraso.ts';
import { computed } from 'vue'

const EquipesStore = useEquipesStore();
const alertStore = useAlertStore();

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const { meta_id: metaId } = route.params;
const { iniciativa_id: iniciativaId } = route.params;

const parentlink = `${metaId ? `/metas/${metaId}` : ''}${iniciativaId ? `/iniciativas/${iniciativaId}` : ''}`;

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const {
  singleIniciativa,
  órgãosResponsáveisNaIniciativaEmFoco,
} = storeToRefs(IniciativasStore);
const AtividadesStore = useAtividadesStore();
const { Atividades } = storeToRefs(AtividadesStore);

const orgaosEquipeIniciativa = computed(() => {
  if (singleIniciativa.value?.ps_ponto_focal?.equipes.length === 0) {
    return null;
  }
  const equipesSelecionadasMeta = EquipesStore.equipesPorIds(singleIniciativa.value?.ps_ponto_focal?.equipes);
  const orgaoIniciativa = equipesSelecionadasMeta.reduce((amount, item) => {
    amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
    return amount;
  }, []);
  return combinadorDeListas(orgaoIniciativa);
});

async function iniciar() {
  const promessas = [];

  // eslint-disable-next-line eqeqeq
  if (singleIniciativa.value.id != iniciativaId) {
    promessas.push(IniciativasStore.getByIdReal(iniciativaId));
    promessas.push(EquipesStore.buscarTudo());
  }
  if (!Atividades.value[iniciativaId]) {
    promessas.push(AtividadesStore.getAll(iniciativaId));
  }

  if (promessas.length) {
    await Promise.allSettled(promessas);
  }

  nextTick().then(() => {
    rolarTelaPara();
  });
}

async function checkDelete(iniciativa) {
  if (iniciativa) {
    alertStore.confirmAction(`Deseja mesmo remover a iniciativa "${iniciativa.titulo}"?`, async () => {
      alertStore.setLoading(true);
      if (await AtividadesStore.delete(metaId, iniciativa.id)) {
        alertStore.setLoading(false);
        AtividadesStore.clear();
        alertStore.success('Iniciativa removida.');
      }
    }, 'Remover');
  }
}

iniciar();
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo mb1">
        {{ activePdm.rotulo_iniciativa }}
      </div>

      <TítuloDePágina
        :class="classeParaFarolDeAtraso(singleIniciativa?.cronograma?.atraso_grau)"
        :title="textoParaFarolDeAtraso(singleIniciativa?.cronograma?.atraso_grau)"
        style="padding-right: 4px;"
        :ícone="activePdm?.logo"
      >
        {{ singleIniciativa.codigo }} - {{ singleIniciativa.titulo }}
      </TítuloDePágina>
    </div>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm'
      ])
        && singleMeta?.pode_editar"
      :to="`/metas/${metaId}/iniciativas/editar/${iniciativaId}`"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>

  <div class="boards">
    <template v-if="singleIniciativa.id">
      <div v-if="route.meta.entidadeMãe === 'pdm'">    
        <div class="flex g2">
          <div class="mr2">
            <div class="t12 uc w700 mb05 tamarelo">
              Órgão responsável
            </div>
            <div class="t13">
              {{ combinadorDeListas(
                órgãosResponsáveisNaIniciativaEmFoco.map(x => x.orgao),
                ',',
                'descricao'
              )
              }}
            </div>
          </div>
          <div class="mr2">
            <div class="t12 uc w700 mb05 tamarelo">
              Órgão participante
            </div>
            <div
              class="t13"
            >
              {{
                combinadorDeListas(
                  singleIniciativa.orgaos_participantes.map(x=>x.orgao),
                  ',',
                  'descricao'
                )
              }}
            </div>
          </div>
          <div class="mr2">
            <div class="t12 uc w700 mb05 tamarelo">
              Responsável na coordenadoria de planejamento
            </div>
            <div
              class="t13"
            >
              {{
                combinadorDeListas(singleIniciativa.coordenadores_cp, ',', 'nome_exibicao')
              }}
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="flex g2 mb2">
          <div class="mr2 f1">
            <div class="t12 uc w700 mb05 tamarelo">
              Órgãos Responsáveis
            </div>
            <div class="t13">
              {{
                combinadorDeListas(
                  orgaoIniciativa = EquipesStore.equipesPorIds(singleIniciativa.ps_ponto_focal.equipes).reduce((amount, item) => {
                    amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                    return amount;
                  }, []))
              }}     
            </div>
          </div>
          <div class="mr2 f1">
            <div class="t12 uc w700 mb05 tamarelo">
              Órgãos Monitoramento
            </div>
            <div class="t13">
              {{
                combinadorDeListas(
                  orgaoIniciativa = EquipesStore.equipesPorIds(singleIniciativa.ps_tecnico_cp.equipes).reduce((amount, item) => {
                    amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                    return amount;
                  }, []))
              }}     
            </div>
          </div>
        </div>
        <div class="flex g2 mb2">
          <div
            v-if="EquipesStore.equipesPorIds(singleIniciativa.ps_ponto_focal.equipes).length"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Equipes Responsáveis
            </div>
            <div class="t13">
              {{ combinadorDeListas(
                EquipesStore.equipesPorIds(singleIniciativa.ps_ponto_focal.equipes),
                false,
                'titulo',
              ) }}
            </div>
          </div>
          <div
            v-if="EquipesStore.equipesPorIds(singleIniciativa.ps_tecnico_cp.equipes).length"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Equipe técnica de monitoramento
            </div>
            <div class="t13">
              {{ combinadorDeListas(
                EquipesStore.equipesPorIds(singleIniciativa.ps_tecnico_cp.equipes),
                false,
                'titulo',
              ) }}
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="singleIniciativa?.tags.length"
        class="mb2"
      >
        <hr class="mt2 mb2">
        <TagsDeMetas :lista-de-tags="singleIniciativa.tags" />
      </div>

      <template v-if="singleIniciativa.contexto">
        <hr class="mb2">
        <div>
          <h4>Contexto</h4>
          <div>{{ singleIniciativa.contexto }}</div>
        </div>
      </template>

      <template v-if="singleIniciativa.complemento">
        <hr class="mt2 mb2">
        <div>
          <h4>
            {{ activePdm.rotulo_complementacao_meta || 'Informações Complementares' }}
          </h4>
          <div>{{ singleIniciativa.complemento }}</div>
        </div>
      </template>

      <hr class="mt2 mb2">

      <SimpleIndicador
        :parentlink="parentlink"
        :parent_id="iniciativaId"
        parent_field="iniciativa_id"
      />

      <template v-if="activePdm.possui_atividade">
        <div class="flex spacebetween center mt4 mb2">
          <h2 class="mb0">
            {{ activePdm.rotulo_atividade }}
          </h2>
          <hr class="ml2 f1">
          <SmaeLink
            v-if="temPermissãoPara([
              'CadastroMeta.administrador_no_pdm',
              'CadastroMetaPS.administrador_no_pdm',
              'CadastroMetaPDM.administrador_no_pdm',
              'SMAE.GrupoVariavel.participante',
            ])
              && singleMeta?.pode_editar"
            :to="`${parentlink}/atividades/novo`"
            class="btn ml2"
          >
            Adicionar {{ activePdm.rotulo_atividade }}
          </SmaeLink>
        </div>

        <template v-if="Atividades[iniciativaId]?.length">
          <div
            v-for="ini in Atividades[iniciativaId]"
            :id="`atividade__${ini.id}`"
            :key="ini.id"
            class="board_variavel mb2"
          >
            <header class="p1 ge mb1">
              <div class="flex center g2 mb1">
                <SmaeLink
                  :to="`${parentlink}/atividades/${ini.id}`"
                  class="f0"
                  style="flex-basis: 2rem;"
                >
                  <svg
                    width="28"
                    height="33"
                    viewBox="0 0 32 38"
                    color="#8EC122"
                    xmlns="http://www.w3.org/2000/svg"
                  ><use xlink:href="#i_atividade" /></svg>
                </SmaeLink>
                <SmaeLink
                  :to="`${parentlink}/atividades/${ini.id}`"
                  class="f1 mt1"
                >
                  <h2 class="mb1">
                    {{ ini.codigo }} - {{ ini.titulo }}
                  </h2>
                </SmaeLink>
                <div class="f0">
                  <SmaeLink
                    title="editar"
                    :to="`${parentlink}/atividades/editar/${ini.id}`"
                    class="tprimary"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_edit" /></svg>
                  </SmaeLink>
                </div>
                <button
                  class="like-a__text"
                  arial-label="excluir"
                  title="excluir"
                  @click="checkDelete(ini)"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_waste" /></svg>
                </button>
              </div>
              <div v-if="route.meta.entidadeMãe === 'pdm'">
                <div class="f1 ml2">
                  <div class="flex g2 ml2">
                    <div class="mr1 f1">
                      <div class="t12 uc w700 mb05 tc300">
                        Órgão participante
                      </div>
                      <div class="t13">
                        {{ ini?.orgaos_participantes?.map(x => x.orgao.descricao).join(', ') }}
                      </div>
                    </div>
                    <div class="f1">
                      <div class="t12 uc w700 mb05 tc300">
                        Responsável na coordenadoria de planejamento
                      </div>
                      <div class="t13">
                        {{ ini?.coordenadores_cp?.map(x => x.nome_exibicao).join(', ') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else>
                <div class="flex g2 mb2">
                  <div class="mr2 f1">
                    <div class="t12 uc w700 mb05 tc300">
                      Órgãos Responsáveis
                    </div>
                    <div class="t13">
                      {{
                        combinadorDeListas(
                          orgaoIniciativa = EquipesStore.equipesPorIds(ini.ps_ponto_focal.equipes).reduce((amount, item) => {
                            amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                            return amount;
                          }, []))
                      }}     
                    </div>
                  </div>   
                  <div class="mr2 f1">
                    <div class="t12 uc w700 mb05 tc300">
                      Órgão monitoramento
                    </div>
                    <div class="t13">
                      {{
                        combinadorDeListas(
                          orgaoIniciativa = EquipesStore.equipesPorIds(ini.ps_tecnico_cp.equipes).reduce((amount, item) => {
                            amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                            return amount;
                          }, []))
                      }}     
                    </div>
                  </div>
                </div>
                <div class="flex g2 mb2">
                  <div class="mr2 f1">
                    <div class="t12 uc w700 mb05 tc300">
                      Equipe do órgão responsável
                    </div>
                    <div class="t13">
                      {{
                        ini.ps_ponto_focal.equipes.length === 0
                          ? '-' :
                            combinadorDeListas(
                              EquipesStore.equipesPorIds(ini.ps_ponto_focal.equipes),
                              false,
                              'titulo',
                            ) }}
                    </div>
                  </div>
                  <div class="mr2 f1">
                    <div class="t12 uc w700 mb05 tc300">
                      Equipe técnica monitoramento
                    </div>
                    <div class="t13">
                      {{
                        ini.ps_tecnico_cp.equipes.length === 0
                          ? '-' :
                            combinadorDeListas(
                              EquipesStore.equipesPorIds(ini.ps_tecnico_cp.equipes),
                              false,
                              'titulo',
                            ) }}
                    </div>
                  </div>
                </div>
              </div>
          </header>
        </div>
      </template>

      <div
        v-if="Atividades[iniciativaId]?.loading"
        class="board_vazio"
      >
        <div class="tc">
          <div class="p1">
            <span>Carregando</span> <svg
              class="ml1 ib"
              width="20"
              height="20"
            ><use xlink:href="#i_spin" /></svg>
          </div>
        </div>
      </div>
    </template>

      <RelacionamentosComOutrosCompromissos
        :iniciativa-id="singleIniciativa.id"
        :pdm-id="activePdm.id"
      />
    </template>
    <template v-else-if="singleIniciativa.loading">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <template v-else-if="singleIniciativa.error">
      <div class="error p1">
        <p class="error-msg">
          Error: {{ singleIniciativa.error }}
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
