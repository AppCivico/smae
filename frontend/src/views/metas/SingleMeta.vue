<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { nextTick, computed } from 'vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import SimpleIndicador from '@/components/metas/SimpleIndicador.vue';
import TagsDeMetas from '@/components/metas/TagsDeMetas.vue';
import RelacionamentosComOutrosCompromissos from '@/components/RelacionamentosComOutrosCompromissos.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import rolarTelaPara from '@/helpers/rolarTelaPara.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useIniciativasStore } from '@/stores/iniciativas.store';
import { useMetasStore } from '@/stores/metas.store';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from './helpers/auxiliaresParaFaroisDeAtraso.ts';

defineOptions({
  inheritAttrs: false,
});

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const { meta_id: metaId } = route.params;

const alertStore = useAlertStore();
const parentlink = `${metaId ? `/metas/${metaId}` : ''}`;

const MetasStore = useMetasStore();
const { activePdm, singleMeta, relacionadosMeta } = storeToRefs(MetasStore);
const IniciativasStore = useIniciativasStore();
const { Iniciativas } = storeToRefs(IniciativasStore);
const EquipesStore = useEquipesStore();

const orgaosEquipeMeta = computed(() => {
  if (singleMeta.value?.ps_ponto_focal?.equipes.length === 0) {
    return null;
  }
  const equipesSelecionadasMeta = EquipesStore.equipesPorIds(
    singleMeta.value?.ps_ponto_focal?.equipes,
  );
  const orgaoMeta = equipesSelecionadasMeta.reduce((amount, item) => {
    amount.push(`${item.orgao.sigla} - ${item.orgao.descricao}`);
    return amount;
  }, []);
  return combinadorDeListas(orgaoMeta, ',');
});

const orgaosEquipeMetaMonitoramento = computed(() => {
  if (singleMeta.value?.ps_tecnico_cp?.equipes.length === 0) {
    return null;
  }
  const equipesSelecionadasMetaMonitoramento = EquipesStore.equipesPorIds(
    singleMeta.value?.ps_tecnico_cp?.equipes,
  );
  const orgaoMetaMonitoramento = equipesSelecionadasMetaMonitoramento.reduce((amount, item) => {
    amount.push(`${item.orgao.sigla} - ${item.orgao.descricao}`);
    return amount;
  }, []);
  return combinadorDeListas(orgaoMetaMonitoramento, ',');
});

async function iniciar() {
  const promessas = [];

  // eslint-disable-next-line eqeqeq
  if (metaId && singleMeta.value.id != metaId) {
    promessas.push(MetasStore.getById(metaId));
    promessas.push(EquipesStore.buscarTudo());
  }
  if (metaId && !activePdm.value.id) {
    promessas.push(MetasStore.getPdM());
  }
  if (!Iniciativas.value[metaId]) {
    promessas.push(IniciativasStore.getAll(metaId));
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
      if (await IniciativasStore.delete(metaId, iniciativa.id)) {
        alertStore.setLoading(false);
        IniciativasStore.clear();
        alertStore.success('Iniciativa removida.');
      }
    }, 'Remover');
  }
}

iniciar();
</script>
<template>
  <div>
    <MigalhasDeMetas class="mb1" />

    <header class="flex spacebetween center mb2">
      <div>
        <div class="t12 uc w700 tamarelo mb1">
          Meta
        </div>

        <TítuloDePágina
          :ícone="activePdm?.logo"
          :class="classeParaFarolDeAtraso(singleMeta?.cronograma?.atraso_grau)"
          :title="textoParaFarolDeAtraso(singleMeta?.cronograma?.atraso_grau)"
          style="padding-right: 4px;"
        >
          {{ singleMeta.codigo }} - {{ singleMeta.titulo }}
        </TítuloDePágina>
      </div>
      <hr class="ml2 f1">
      <SmaeLink
        v-if="singleMeta?.pode_editar"
        :to="`/metas/editar/${singleMeta.id}`"
        class="btn big ml2"
      >
        Editar
      </SmaeLink>
    </header>

    <div class="boards">
      <template v-if="singleMeta.id">
        <div class="flex g2">
          <div
            v-if="activePdm.possui_macro_tema"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              {{ activePdm.rotulo_macro_tema }}
            </div>
            <div class="t13">
              {{ singleMeta?.macro_tema?.descricao }}
            </div>
          </div>
          <div
            v-if="activePdm.possui_tema"
            class="mr2 f2"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              {{ activePdm.rotulo_tema }}
            </div>
            <div class="t13">
              {{ singleMeta?.tema?.descricao }}
            </div>
          </div>
          <div
            v-if="activePdm.possui_sub_tema"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              {{ activePdm.rotulo_sub_tema }}
            </div>
            <div class="t13">
              {{ singleMeta?.sub_tema?.descricao }}
            </div>
          </div>
        </div>

        <hr class="mt2 mb2">

        <div
          v-if="route.meta.entidadeMãe === 'pdm'"
          class="flex g2 mb2"
        >
          <div
            v-if="singleMeta.orgaos_participantes.filter(x => x.responsavel)"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Órgão responsável
            </div>
            <div class="t13">
              {{ singleMeta.orgaos_participantes.filter((x) =>
                x.responsavel).map(x => x.orgao.descricao).join(', ') }}
            </div>
          </div>
          <div
            v-if="singleMeta.orgaos_participantes.filter(x => !x.responsavel).length"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Órgão participante
            </div>
            <div class="t13">
              {{
                singleMeta.orgaos_participantes
                  .filter(x => !x.responsavel).map(x => x.orgao.descricao).join(', ')
              }}
            </div>
          </div>
          <div
            v-if="singleMeta.coordenadores_cp"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Responsável na coordenadoria de planejamento
            </div>
            <div class="t13">
              {{ singleMeta.coordenadores_cp.map(x => x.nome_exibicao).join(', ') }}
            </div>
          </div>
        </div>
        <div
          v-else
        >
          <div class="flex g2 mb2">
            <div class="mr2 f1">
              <div class="t12 uc w700 mb05 tamarelo">
                Órgãos Responsáveis
              </div>
              <div class="t13">
                {{ orgaosEquipeMeta }}
              </div>
            </div>
            <div class="mr2 f1">
              <div class="t12 uc w700 mb05 tamarelo">
                Órgãos Monitoramento
              </div>
              <div class="t13">
                {{ orgaosEquipeMetaMonitoramento }}
              </div>
            </div>
          </div>
          <div class="flex g2 mb2">
            <div
              v-if="EquipesStore.equipesPorIds(singleMeta.ps_ponto_focal.equipes).length"
              class="mr2 f1"
            >
              <div class="t12 uc w700 mb05 tamarelo">
                Equipes Responsáveis
              </div>
              <div class="t13">
                {{ combinadorDeListas(
                  EquipesStore.equipesPorIds(singleMeta.ps_ponto_focal.equipes),
                  ',',
                  'titulo',
                ) }}
              </div>
            </div>
            <div
              v-if="EquipesStore.equipesPorIds(singleMeta.ps_tecnico_cp.equipes).length"
              class="mr2 f1"
            >
              <div class="t12 uc w700 mb05 tamarelo">
                Equipe técnica de monitoramento
              </div>
              <div class="t13">
                {{ combinadorDeListas(
                  EquipesStore.equipesPorIds(singleMeta.ps_tecnico_cp.equipes),
                  ',',
                  'titulo',
                ) }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="singleMeta?.tags.length"
          class="mb2"
        >
          <hr class="mt2 mb2">
          <TagsDeMetas :lista-de-tags="singleMeta.tags" />
        </div>

        <div
          v-if="activePdm.possui_contexto_meta"
          class="mr2 f2"
        >
          <hr class="mb2">
          <h4>{{ activePdm.rotulo_contexto_meta }}</h4>
          <div>{{ singleMeta.contexto }}</div>
          <hr class="mt2 mb2">
        </div>
        <div
          v-if="activePdm.possui_complementacao_meta && singleMeta.complemento"
          class=""
        >
          <h4>{{ activePdm.rotulo_complementacao_meta }}</h4>
          <div>{{ singleMeta.complemento }}</div>
          <hr class="mt2 mb2">
        </div>

        <SimpleIndicador
          :parentlink="parentlink"
          :parent_id="metaId"
          parent_field="meta_id"
        />
        <template v-if="activePdm.possui_iniciativa">
          <div class="flex spacebetween center mt4 mb2">
            <h2 class="mb0">
              {{ activePdm.rotulo_iniciativa }}
            </h2>
            <hr class="ml2 f1">
            <SmaeLink
              v-if="temPermissãoPara([
                'CadastroMeta.administrador_no_pdm',
                'CadastroMetaPS.administrador_no_pdm',
                'CadastroMetaPDM.administrador_no_pdm'
              ])
                && activePdm.possui_iniciativa
                && activePdm?.pode_editar"
              :to="`${parentlink}/iniciativas/novo`"
              class="btn ml2"
            >
              Adicionar {{ activePdm.rotulo_iniciativa }}
            </SmaeLink>
          </div>

          <template v-if="Array.isArray(Iniciativas[metaId])">
            <div
              v-for="ini in Iniciativas[metaId]"
              :id="`iniciativa__${ini.id}`"
              :key="ini.id"
              class="board_variavel mb2"
            >
              <header class="p1 ge mb1">
                <div class="flex center g2 mb1">
                  <SmaeLink
                    :to="`${parentlink}/iniciativas/${ini.id}`"
                    class="f0"
                    style="flex-basis: 2rem;"
                  >
                    <svg
                      width="28"
                      height="33"
                      viewBox="0 0 32 38"
                      color="#8EC122"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <use xlink:href="#i_iniciativa" />
                    </svg>
                  </SmaeLink>
                  <SmaeLink
                    :to="`${parentlink}/iniciativas/${ini.id}`"
                    class="f1 mt1"
                  >
                    <h2 class="mb1">
                      {{ ini.codigo }} - {{ ini.titulo }}
                    </h2>
                  </SmaeLink>

                  <div
                    v-if="temPermissãoPara([
                      'CadastroMeta.administrador_no_pdm',
                      'CadastroMetaPS.administrador_no_pdm',
                      'CadastroMetaPDM.administrador_no_pdm',
                      'SMAE.GrupoVariavel.participante',
                    ]) && singleMeta?.pode_editar"
                    class="f0 flex g1"
                  >
                    <SmaeLink
                      :to="`${parentlink}/iniciativas/editar/${ini.id}`"
                      class="tprimary"
                    >
                      <svg
                        width="20"
                        height="20"
                      >
                        <use xlink:href="#i_edit" />
                      </svg>
                    </SmaeLink>
                    <button
                      class="like-a__text"
                      aria-label="excluir"
                      title="excluir"
                      @click="checkDelete(ini)"
                    >
                      <svg
                        width="20"
                        height="20"
                      >
                        <use xlink:href="#i_waste" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-if="route.meta.entidadeMãe === 'pdm'">
                  <div class="flex g2 mb2">
                    <div class="mr1 f0">
                      <div class="t12 uc w700 mb05 tc300">
                        Órgão responsável
                      </div>
                      <div class="t13">
                        {{ ini.orgaos_participantes.filter((x) =>
                          x.responsavel).map(x => x.orgao.descricao).join(', ') }}
                      </div>
                    </div>

                    <div
                      v-if="ini.orgaos_participantes.filter(x => !x.responsavel).length"
                      class="f1"
                    >
                      <div class="t12 uc w700 mb05 tc300">
                        Órgão participante
                      </div>
                      <div class="t13">
                        {{
                          ini.orgaos_participantes
                            .filter(x => !x.responsavel).map(x => x.orgao.descricao).join(', ')
                        }}
                      </div>
                    </div>
                    <div
                      v-if="ini.coordenadores_cp"
                      class="f1"
                    >
                      <div class="t12 uc w700 mb05 tc300">
                        Responsável na coordenadoria de planejamento
                      </div>
                      <div class="t13">
                        {{ ini.coordenadores_cp.map(x => x.nome_exibicao).join(', ') }}
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
                            orgaoIniciativa = EquipesStore
                              .equipesPorIds(ini.ps_ponto_focal.equipes)
                              .reduce((amount, item) => {
                                amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                                return amount;
                              }, []),
                            ','
                          )
                        }}
                      </div>
                    </div>
                    <div class="mr2 f1">
                      <div class="t12 uc w700 mb05 tc300">
                        Órgãos Monitoramento
                      </div>
                      <div class="t13">
                        {{
                          combinadorDeListas(
                            orgaoIniciativa = EquipesStore
                              .equipesPorIds(ini.ps_tecnico_cp.equipes)
                              .reduce((amount, item) => {
                                amount.push(item.orgao.sigla + " - " + item.orgao.descricao);
                                return amount;
                              }, []),
                            ','
                          )
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
                                ',',
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
                                ',',
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
            v-if="Iniciativas[metaId]?.loading"
            class="board_vazio"
          >
            <div class="tc">
              <div class="p1">
                <span>Carregando</span> <svg
                  class="ml1 ib"
                  width="20"
                  height="20"
                >
                  <use xlink:href="#i_spin" />
                </svg>
              </div>
            </div>
          </div>
          <ErrorComponent
            v-else-if="Iniciativas[metaId]?.error"
            class="board_vazio"
          >
            {{ Iniciativas[metaId]?.error }}
          </ErrorComponent>
        </template>

        <RelacionamentosComOutrosCompromissos
          :pdm-id="activePdm.id"
          :meta-id="metaId"
        />
      </template>
      <template v-else-if="singleMeta?.loading">
        <div class="p1">
          <span>Carregando</span> <svg
            class="ml1 ib"
            width="20"
            height="20"
          >
            <use xlink:href="#i_spin" />
          </svg>
        </div>
      </template>
      <template v-else-if="singleMeta.error">
        <div class="error p1">
          <p class="error-msg">
            Erro: {{ singleMeta.error }}
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
  </div>
</template>
<style lang="less" scoped>
.icone-de-tag {
  max-width: 140px;
  max-height: 140px;
  object-fit: cover;
}
</style>
