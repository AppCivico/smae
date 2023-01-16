<script setup>
import { Dashboard } from '@/components';
import {
  useAlertStore, useAuthStore, useCronogramasStore, useEditModalStore, useMetasStore
} from '@/stores';
import { default as AddEditEtapa } from '@/views/metas/AddEditEtapa.vue';
import { default as AddEditFase } from '@/views/metas/AddEditFase.vue';
import { default as AddEditMonitorar } from '@/views/metas/AddEditMonitorar.vue';
import { storeToRefs } from 'pinia';
import {
  onMounted, onUpdated, reactive, ref
} from 'vue';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();
const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const props = defineProps(['group', 'recorte']);
const route = useRoute();
const meta_id = reactive(route.params.meta_id);
const iniciativa_id = reactive(route.params.iniciativa_id);
const atividade_id = reactive(route.params.atividade_id);

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
MetasStore.getPdM();

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;
const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parentField = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const parentLabel = ref(atividade_id ? '-' : iniciativa_id ? '-' : meta_id ? 'Meta' : false);
(async () => {
  await MetasStore.getPdM();
  if (atividade_id) parentLabel.value = activePdm.value.rotulo_atividade;
  else if (iniciativa_id) parentLabel.value = activePdm.value.rotulo_iniciativa;
})();

const CronogramasStore = useCronogramasStore();
const { singleCronograma, singleCronogramaEtapas } = storeToRefs(CronogramasStore);
const editModalStore = useEditModalStore();

function excluirEtapa(id) {
  alertStore.confirmAction('Deseja mesmo excluir?', () => {
    CronogramasStore.excluirEtapa(id);
  }, 'Excluir');
}

CronogramasStore.clearEdit();
CronogramasStore.getActiveByParent(parentVar, parentField);

function start() {
  if (props.group == 'etapas') editModalStore.modal(AddEditEtapa, props);
  if (props.group == 'fase') editModalStore.modal(AddEditFase, props);
  if (props.group == 'subfase') editModalStore.modal(AddEditFase, props);
  if (props.group == 'monitorar') editModalStore.modal(AddEditMonitorar, props);
}
onMounted(() => { start(); });
onUpdated(() => { start(); });
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <div>
        <div class="t12 uc w700 tamarelo">
          {{ parentLabel }}
        </div>
        <h1>Cronograma</h1>
      </div>
      <hr class="ml2 f1">
      <router-link
        v-if="perm?.CadastroCronograma?.editar && !singleCronograma?.loading && singleCronograma?.id"
        :to="`${parentlink}/cronograma/${singleCronograma?.id}`"
        class="btn ml2"
      >
        Editar Cronograma
      </router-link>
      <div
        v-if="!singleCronograma?.loading && singleCronograma?.id"
        class="ml1 dropbtn"
      >
        <span class="btn">Nova etapa</span>
        <ul>
          <li>
            <router-link
              v-if="perm?.CadastroEtapa?.inserir"
              :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/novo`"
            >
              Etapa da {{ parentLabel }}
            </router-link>
          </li>
          <li>
            <router-link
              v-if="activePdm.possui_iniciativa && perm?.CadastroEtapa?.inserir && meta_id && !iniciativa_id"
              :to="`${parentlink}/cronograma/${singleCronograma?.id}/monitorar/iniciativa`"
            >
              A partir de {{ activePdm.rotulo_iniciativa }}
            </router-link>
          </li>
          <li>
            <router-link
              v-if="activePdm.possui_atividade && perm?.CadastroEtapa?.inserir && meta_id && !atividade_id"
              :to="`${parentlink}/cronograma/${singleCronograma?.id}/monitorar/atividade`"
            >
              A partir de {{ activePdm.rotulo_atividade }}
            </router-link>
          </li>
        </ul>
      </div>
      <div
        v-else
        class="ml2"
      >
        <button class="btn disabled">
          Nova etapa
        </button>
      </div>
    </div>

    <template v-if="!singleCronograma?.loading && singleCronograma?.id">
      <div class="boards">
        <div class="flex g2">
          <div class="mr2">
            <div class="t12 uc w700 mb05 tamarelo">
              Inicio previsto
            </div>
            <div class="t13">
              {{
                singleCronograma.inicio_previsto
                  ? singleCronograma.inicio_previsto
                  : '--/--/----'
              }}
            </div>
          </div>
          <div class="mr2">
            <div class="t12 uc w700 mb05 tamarelo">
              Término previsto
            </div>
            <div class="t13">
              {{
                singleCronograma.termino_previsto
                  ? singleCronograma.termino_previsto
                  : '--/--/----'
              }}
            </div>
          </div>
          <div class="mr2">
            <div class="t12 uc w700 mb05 tamarelo">
              Inicio real
            </div>
            <div class="t13">
              {{ singleCronograma.inicio_real ? singleCronograma.inicio_real : '--/--/----' }}
            </div>
          </div>
          <div class="mr2">
            <div class="t12 uc w700 mb05 tamarelo">
              Término real
            </div>
            <div class="t13">
              {{ singleCronograma.termino_real ? singleCronograma.termino_real : '--/--/----' }}
            </div>
          </div>
        </div>
        <div v-if="singleCronograma.descricao">
          <hr class="mt2 mb2">
          <h4>Descrição</h4>
          <div>{{ singleCronograma.descricao }}</div>
        </div>
        <div v-if="singleCronograma.observacao">
          <hr class="mt2 mb2">
          <h4>Observação</h4>
          <div>{{ singleCronograma.observacao }}</div>
        </div>
        <hr class="mt2 mb2">
      </div>

      <div
        v-if="!singleCronogramaEtapas?.loading && singleCronogramaEtapas.length"
        class="etapas"
      >
        <div
          v-for="(r, index) in singleCronogramaEtapas?.filter(x => !x.inativo)
            .sort((a, b) => a.ordem - b.ordem)"
          :key="r.etapa.id"
          class="etapa"
        >
          <div class="status">
            <span>{{ index + 1 }}</span>
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
              {{ r.etapa.atraso ?? '-' }}
            </div>
            <div
              class="ml1 f0"
              style="flex-basis:20px; height: calc(20px + 1rem);"
            >
              <div
                v-if="perm?.CadastroEtapa?.editar"
                class="dropbtn right"
              >
                <span class=""><svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_more" /></svg></span>
                <ul>
                  <li>
                    <router-link
                      v-if="(!r.cronograma_origem_etapa || r.cronograma_origem_etapa.id == singleCronograma?.id)"
                      :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/${r.etapa.id}`"
                    >
                      Editar Etapa
                    </router-link>
                  </li>
                  <li>
                    <router-link
                      v-if="r.cronograma_origem_etapa && r.cronograma_origem_etapa?.id != singleCronograma?.id"
                      :to="`${parentlink}/cronograma/${singleCronograma?.id}/monitorar/${r.etapa.id}`"
                    >
                      Editar Monitoramento
                    </router-link>
                  </li>

                  <li
                    v-if="(!r.cronograma_origem_etapa || r.cronograma_origem_etapa.id == singleCronograma?.id)"
                  >
                    <button
                      class="like-a__link"
                      type="button"
                      :disabled="r.etapa_filha?.length"
                      @click="excluirEtapa(r.etapa_id)"
                    >
                      Excluir Etapa
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <hr class="mb05">
          <div
            v-if="r.cronograma_origem_etapa && r.cronograma_origem_etapa?.id != singleCronograma?.id"
            class="pl3 flex center t11 w700 tc600"
          >
            <router-link
              v-if="r.cronograma_origem_etapa.atividade"
              :to="`/metas/${r.cronograma_origem_etapa.atividade.iniciativa.meta.id}/iniciativas/${r.cronograma_origem_etapa.atividade.iniciativa.id}/atividades/${r.cronograma_origem_etapa.atividade.id}/cronograma`"
            >
              <svg
                class="mr1"
                width="12"
                height="14"
                viewBox="0 0 12 14"
                xmlns="http://www.w3.org/2000/svg"
              ><use xlink:href="#i_atividade" /></svg>
              <span>Etapa via atividade {{ r.cronograma_origem_etapa.atividade.codigo }} {{ r.cronograma_origem_etapa.atividade.titulo }}</span>
            </router-link>
            <router-link
              v-else-if="r.cronograma_origem_etapa.iniciativa"
              :to="`/metas/${r.cronograma_origem_etapa.iniciativa.meta.id}/iniciativas/${r.cronograma_origem_etapa.iniciativa.id}/cronograma`"
            >
              <svg
                class="mr1"
                width="12"
                height="14"
                viewBox="0 0 12 14"
                xmlns="http://www.w3.org/2000/svg"
              ><use xlink:href="#i_iniciativa" /></svg>
              <span>Etapa via iniciativa {{ r.cronograma_origem_etapa.iniciativa.codigo }} {{ r.cronograma_origem_etapa.iniciativa.titulo }}</span>
            </router-link>
          </div>

          <div
            v-for="(rr, rrindex) in r.etapa.etapa_filha"
            :key="rr.id"
            class="etapa sub"
          >
            <div class="status">
              <span>
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
              <div
                class="ml1 f0"
                style="flex-basis:20px;"
              />
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
                {{ rr.atraso ?? '-' }}
              </div>
              <div
                class="ml1 f0 flex center mr05"
                style="flex-basis:20px; height: calc(20px + 1rem);"
              >
                <button
                  v-if="(!rr.cronograma_origem_etapa || rr.cronograma_origem_etapa.id == singleCronograma?.id)"
                  type="button"
                  class="like-a__text"
                  title="Excluir Fase"
                  :disabled="rr.etapa_filha?.length"
                  @click="excluirEtapa(rr.etapa_id)"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_remove" /></svg>
                </button>
              </div>

              <div
                class="ml1 f0 flex center mr05"
                style="flex-basis:20px; height: calc(20px + 1rem);"
              >
                <router-link
                  v-if="(!r.cronograma_origem_etapa || r.cronograma_origem_etapa.id == singleCronograma?.id)"
                  :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/${r.etapa.id}/${rr.id}`"
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
                <div
                  class="ml1 f0"
                  style="flex-basis:20px;"
                />
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
                    <span class="farol f0">
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
                    {{ rrr.duracao ?? '-' }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.inicio_real }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.termino_real }}
                  </div>
                  <div class="ml1 f1">
                    {{ rrr.atraso ?? '-' }}
                  </div>

                  <div
                    class="ml1 f0 flex center mr05"
                  >
                    <button
                      v-if="(!rrr.cronograma_origem_etapa || rrr.cronograma_origem_etapa.id == singleCronograma?.id)"
                      type="button"
                      class="like-a__text"
                      title="Excluir Subfase"
                      :disabled="rrr.etapa_filha?.length"
                      @click="excluirEtapa(rrr.etapa_id)"
                    >
                      <svg
                        width="20"
                        height="20"
                      ><use xlink:href="#i_remove" /></svg>
                    </button>
                  </div>

                  <div
                    class="ml1 f0 flex center mr05"
                    style="flex-basis:20px; height: calc(20px + 1rem);"
                  >
                    <router-link
                      v-if="(!r.cronograma_origem_etapa || r.cronograma_origem_etapa.id == singleCronograma?.id)"
                      :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/${r.etapa.id}/${rr.id}/${rrr.id}`"
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
            <div class="pl3">
              <router-link
                v-if="(!r.cronograma_origem_etapa || r.cronograma_origem_etapa.id == singleCronograma?.id)"
                :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/${r.etapa.id}/${rr.id}/novo`"
                class="addlink mt05 mb05"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_+" /></svg> <span>Adicionar Subfase</span>
              </router-link>
            </div>
            <hr class="mb1">
          </div>
          <div class="pl1">
            <router-link
              v-if="(!r.cronograma_origem_etapa || r.cronograma_origem_etapa.id == singleCronograma?.id)"
              :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/${r.etapa.id}/novo`"
              class="addlink"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg> <span>Adicionar Fase</span>
            </router-link>
          </div>
        </div>
      </div>
      <template v-else-if="singleCronogramaEtapas?.loading">
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
        <div class="tc">
          <router-link
            :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/novo`"
            class="btn mt1 mb1"
          >
            <span>Adicionar Etapa</span>
          </router-link>
        </div>
      </div>
    </template>
    <template v-else-if="singleCronograma?.loading">
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
      class="p1 bgc50 mb2"
    >
      <div class="tc">
        <router-link
          :to="`${parentlink}/cronograma/novo`"
          class="btn mt1 mb1"
        >
          <span>Adicionar Cronograma</span>
        </router-link>
      </div>
    </div>
  </Dashboard>
</template>
