<script setup>
import { Dashboard } from '@/components';
import { default as itemFilho } from '@/components/monitoramento/itemFilho.vue';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { usePdMStore } from '@/stores/pdm.store';
import { default as AddEditEtapa } from '@/views/monitoramento/AddEditEtapa.vue';
import { storeToRefs } from 'pinia';
import {
  onMounted, onUpdated, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from '../metas/helpers/auxiliaresParaFaroisDeAtraso.ts';

const editModalStore = useEditModalStore();
const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;
const { cron_id } = route.params;
const { etapa_id } = route.params;

const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

const CiclosStore = useCiclosStore();
const { SingleMeta, SingleCronograma, SingleCronogramaEtapas } = storeToRefs(CiclosStore);

const parentlink = `${meta_id || ''}${iniciativa_id ? `/${iniciativa_id}` : ''}${atividade_id ? `/${atividade_id}` : ''}`;
const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parentField = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : meta_id ? 'meta' : false;
const parentFieldId = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const parentLabel = ref(atividade_id ? activePdm.value?.rotulo_atividade : iniciativa_id ? activePdm.value?.rotulo_iniciativa : meta_id ? 'Meta' : false);

watch(activePdm, async (v, vold) => {
  if (atividade_id) parentLabel.value = v.rotulo_atividade;
  else if (iniciativa_id) parentLabel.value = v.rotulo_iniciativa;
});

const currentParent = ref({});
CiclosStore.getCronogramasActiveByParent(parentVar, parentFieldId);
(async () => {
  await CiclosStore.getMetaByIdCron(meta_id);
  currentParent.value = SingleMeta.value;
  if (iniciativa_id) currentParent.value = currentParent.value?.meta?.iniciativas.find((x) => x.iniciativa.id == iniciativa_id);
  if (atividade_id) currentParent.value = currentParent.value?.atividades.find((x) => x.atividade.id == atividade_id);
})();

function start() {
  if (cron_id && etapa_id) editModalStore.modal(AddEditEtapa);
}
onMounted(() => { start(); });
onUpdated(() => { start(); });
</script>
<template>
  <Dashboard>
    <MigalhasDePão class="mb1" />

    <div class="label tamarelo">
      Cronograma de {{ parentLabel }}
    </div>
    <div class="mb2">
      <div class="flex spacebetween center">
        <h1
          :class="classeParaFarolDeAtraso(SingleCronograma?.atraso_grau)"
          :title="textoParaFarolDeAtraso(SingleCronograma?.atraso_grau)"
          style="padding-right: 8px;"
        >
          {{ parentLabel }} {{ currentParent[parentField]?.codigo }} - {{ currentParent[parentField]?.titulo }}
        </h1>
        <hr class="ml2 f1">
      </div>
    </div>

    <template v-if="!SingleCronograma?.loading && SingleCronograma?.id">
      <div
        v-if="!SingleCronogramaEtapas?.loading && SingleCronogramaEtapas.length"
        class="etapas"
      >
        <div
          v-for="(r, index) in SingleCronogramaEtapas?.filter(x => !x.inativo).sort((a, b) => a.ordem - b.ordem)"
          :key="r.etapa.id"
          class="etapa"
        >
          <div class="status">
            <span
              :class="classeParaFarolDeAtraso(r.etapa.atraso_grau)"
              :title="textoParaFarolDeAtraso(r.etapa.atraso_grau)"
            >{{ index + 1 }}</span>
          </div>
          <div class="title mb1">
            <h3>{{ r.etapa.titulo }}</h3>
          </div>
          <div class="pl3 flex center mb05 tc300 w700 t12 uc">
            <div class="f1">
              Início Prev.
            </div>
            <div class="ml1 f1">
              Término Prev.
            </div>
            <div class="ml1 f1">
              Duração
            </div>
            <div class="ml1 f1">
              Início Real
            </div>
            <div class="ml1 f1">
              Término Real
            </div>
            <div class="ml1 f1">
              Atraso
            </div>
            <div class="ml1 f0" />
            <div
              class="ml1 f0"
              style="flex-basis:20px;"
            />
          </div>
          <hr>

          <div class="pl3 flex center t13">
            <div class="f1">
              {{ r.etapa.inicio_previsto }}
            </div>
            <div class="ml1 f1">
              {{ r.etapa.termino_previsto }}
            </div>
            <div class="ml1 f1">
              {{ r.etapa.duracao ?? '-' }}
            </div>
            <div class="ml1 f1">
              {{ r.etapa.inicio_real }}
            </div>
            <div class="ml1 f1">
              {{ r.etapa.termino_real }}
            </div>
            <div class="ml1 f1">
              {{ r.etapa.atraso ? r.etapa.atraso + ' dias' : '-' }}
            </div>

            <div class="ml1 f0">
              <span
                v-if="r?.etapa?.variavel"
                class="tipinfo left"
              >
                <svg
                  width="24"
                  height="24"
                ><use xlink:href="#i_variavel" /></svg>
                <div>
                  Vínculada à variável
                  <strong v-if="r.etapa?.variavel?.codigo">
                    {{ r.etapa.variavel.codigo }}
                  </strong>
                  {{ r.etapa.variavel?.titulo }}
                </div>
              </span>
            </div>

            <div
              class="ml1 f0 flex center"
              style="flex-basis:20px; height: calc(20px + 1rem);"
            >
              <router-link
                v-if="!r.etapa.n_filhos_imediatos
                  && !(r.cronograma_origem_etapa && r.cronograma_origem_etapa.id != SingleCronograma?.id)"
                :to="`/monitoramento/cronograma/${parentlink}/editar/${r.cronograma_id}/${r.etapa.id}`"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </div>
          </div>
          <hr class="mb05">
          <div
            v-if="r.cronograma_origem_etapa && r.cronograma_origem_etapa.id != SingleCronograma?.id"
            class="pl3 flex center t11 w700 tc600"
          >
            <router-link
              v-if="r.cronograma_origem_etapa.atividade"
              :to="`/monitoramento/cronograma/${meta_id}/${r.cronograma_origem_etapa.atividade.iniciativa.id}/${r.cronograma_origem_etapa.atividade.id}`"
            >
              <svg
                class="mr1"
                width="12"
                height="14"
                viewBox="0 0 12 14"
                xmlns="http://www.w3.org/2000/svg"
              ><use xlink:href="#i_atividade" /></svg>
              <span>Etapa via {{ activePdm.rotulo_atividade }} {{ r.cronograma_origem_etapa.atividade.codigo }} {{ r.cronograma_origem_etapa.atividade.titulo }}</span>
            </router-link>
            <router-link
              v-else-if="r.cronograma_origem_etapa.iniciativa"
              :to="`/monitoramento/cronograma/${meta_id}/${r.cronograma_origem_etapa.iniciativa.id}`"
            >
              <svg
                class="mr1"
                width="12"
                height="14"
                viewBox="0 0 12 14"
                xmlns="http://www.w3.org/2000/svg"
              ><use xlink:href="#i_iniciativa" /></svg>
              <span>Etapa via {{ activePdm.rotulo_iniciativa }} {{ r.cronograma_origem_etapa.iniciativa.codigo }} {{ r.cronograma_origem_etapa.iniciativa.titulo }}</span>
            </router-link>
          </div>

          <div
            v-for="(rr, rrindex) in r.etapa.etapa_filha"
            :key="rr.id"
            class="etapa sub"
          >
            <div class="status">
              <span
                :class="classeParaFarolDeAtraso(rr.atraso_grau)"
                :title="textoParaFarolDeAtraso(rr.atraso_grau)"
              >
                <small class="niveis-pais">{{ index + 1 }}.</small>{{ rrindex + 1 }}
              </span>
            </div>
            <div class="title">
              <h4>{{ rr.titulo }}</h4>
            </div>
            <div class="pl3 flex center mb05 tc300 w700 t12 uc">
              <div class="f1">
                Início Prev.
              </div>
              <div class="ml1 f1">
                Término Prev.
              </div>
              <div class="ml1 f1">
                Duração
              </div>
              <div class="ml1 f1">
                Início Real
              </div>
              <div class="ml1 f1">
                Término Real
              </div>
              <div class="ml1 f1">
                Atraso
              </div>
              <div class="ml1 f0" />
              <div
                class="ml1 f0"
                style="flex-basis:20px;"
              />
            </div>
            <hr>
            <div class="pl3 flex center t13">
              <div class="f1">
                {{ rr.inicio_previsto }}
              </div>
              <div class="ml1 f1">
                {{ rr.termino_previsto }}
              </div>
              <div class="ml1 f1">
                {{ rr.duracao ?? '-' }}
              </div>
              <div class="ml1 f1">
                {{ rr.inicio_real }}
              </div>
              <div class="ml1 f1">
                {{ rr.termino_real }}
              </div>
              <div class="ml1 f1">
                {{ rr.atraso ? rr.atraso + ' dias' : '-' }}
              </div>

              <div class="ml1 f0">
                <span
                  v-if="rr?.variavel"
                  class="tipinfo left"
                >
                  <svg
                    width="24"
                    height="24"
                  ><use xlink:href="#i_variavel" /></svg>
                  <div>
                    Vínculada à variável
                    <strong v-if="rr.variavel?.codigo">
                      {{ rr.variavel.codigo }}
                    </strong>
                    {{ rr.variavel?.titulo }}
                  </div>
                </span>
              </div>

              <div
                class="ml1 f0 flex center"
                style="flex-basis:20px; height: calc(20px + 1rem);"
              >
                <router-link
                  v-if="rr.CronogramaEtapa && !rr.n_filhos_imediatos
                    && !(r.cronograma_origem_etapa
                      && r.cronograma_origem_etapa.id != SingleCronograma?.id
                    )"
                  :to="`/monitoramento/cronograma/${parentlink}/editar/${rr.CronogramaEtapa[0].cronograma_id}/${rr.id}`"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </router-link>
              </div>
            </div>
            <hr class="mb3">

            <div
              v-if="rr?.etapa_filha?.length"
              class="list mt2"
            >
              <div class="pl3 flex center mb05 tc300 w700 t12 uc ">
                <div class="f2">
                  SUBFASE
                </div>
                <div class="ml1 f1">
                  início prev.
                </div>
                <div class="ml1 f1">
                  Término Prev.
                </div>
                <div class="ml1 f1">
                  Duração
                </div>
                <div class="ml1 f1">
                  Início Real
                </div>
                <div class="ml1 f1">
                  Término Real
                </div>
                <div class="ml1 f1">
                  Atraso
                </div>
                <div class="ml1 f0" />
                <div
                  class="ml1 f0"
                  style="flex-basis:20px;"
                />
              </div>
              <hr>
              <template
                v-for="(rrr, rrrindex) in rr.etapa_filha"
                :key="rrr.id"
              >
                <div class="pl3 flex center t13">
                  <div class="f2 flex center">
                    <span
                      class="farol f0"
                      :class="classeParaFarolDeAtraso(rrr.atraso_grau)"
                      :title="textoParaFarolDeAtraso(rrr.atraso_grau)"
                    >
                      <small class="niveis-pais">{{ index + 1 }}.{{ rrindex + 1 }}.</small>{{ rrrindex + 1 }}
                    </span>
                    <span>{{ rrr.titulo }}</span>
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.inicio_previsto }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.termino_previsto }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.duracao??'-' }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.inicio_real }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.termino_real }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.atraso ? rrr.atraso + ' dias' : '-' }}
                  </div>

                  <div class="ml1 f0">
                    <span
                      v-if="rrr?.variavel"
                      class="tipinfo left"
                    >
                      <svg
                        width="24"
                        height="24"
                      ><use xlink:href="#i_variavel" /></svg>
                      <div>
                        Vínculada à variável
                        <strong v-if="rrr.variavel?.codigo">
                          {{ rrr.variavel.codigo }}
                        </strong>
                        {{ rrr.variavel?.titulo }}
                      </div>
                    </span>
                  </div>

                  <div
                    class="ml1 f0 flex center"
                    style="flex-basis:20px; height: calc(20px + 1rem);"
                  >
                    <router-link
                      v-if="rrr.CronogramaEtapa && !rrr.n_filhos_imediatos"
                      :to="`/monitoramento/cronograma/${parentlink}/editar/${rrr.CronogramaEtapa[0].cronograma_id}/${rrr.id}`"
                    >
                      <svg
                        width="20"
                        height="20"
                      ><use xlink:href="#i_edit" /></svg>
                    </router-link>
                  </div>
                </div>
                <hr>
              </template>
            </div>
            <hr class="mb1">
          </div>
        </div>
      </div>
      <template v-else-if="SingleCronogramaEtapas?.loading">
        <div class="p1">
          <span>Carregando</span> <svg
            class="ml1 ib"
            width="20"
            height="20"
          ><use xlink:href="#i_spin" /></svg>
        </div>
      </template>
      <div
        v-else
        class="p1 bgc50"
      >
        <div class="p1">
          <span>Nenhuma etapa encontrada</span>
        </div>
      </div>
    </template>
    <template v-else-if="SingleCronograma?.loading">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>

    <template v-if="currentParent.meta?.iniciativas?.length">
      <div class="flex spacebetween center mt4 mb2">
        <h2>{{ activePdm.rotulo_iniciativa }}(s) com cronograma</h2>
        <hr class="ml2 f1">
      </div>
      <itemFilho
        :group="currentParent.meta.iniciativas"
        chave="iniciativa"
        :link="`/monitoramento/cronograma/${meta_id}/`"
      />
    </template>
    <template v-if="currentParent.atividades?.length">
      <div class="flex spacebetween center mt4 mb2">
        <h2>{{ activePdm.rotulo_atividade }}(s) com cronograma</h2>
        <hr class="ml2 f1">
      </div>
      <itemFilho
        :group="currentParent.atividades"
        chave="atividade"
        :link="`/monitoramento/cronograma/${meta_id}/${iniciativa_id}/`"
      />
    </template>
  </Dashboard>
</template>
