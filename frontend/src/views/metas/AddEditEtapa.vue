<script setup>
import { default as AutocompleteField } from '@/components/AutocompleteField.vue';
import { etapa as schema } from '@/consts/formSchemas';
import { router } from '@/router';
import {
  useAlertStore, useAtividadesStore, useCronogramasStore, useEditModalStore, useEtapasStore, useIniciativasStore, useMetasStore, useRegionsStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import temDescendenteEmOutraRegião from './auxiliares/temDescendenteEmOutraRegiao.ts';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;
const { cronograma_id } = route.params;
const { etapa_id } = route.params;

const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parentField = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const currentEdit = route.path.slice(0, route.path.indexOf('/cronograma') + 11);

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const CronogramasStore = useCronogramasStore();
const { singleCronograma } = storeToRefs(CronogramasStore);
if (cronograma_id && (!singleCronograma?.value?.id || singleCronograma?.value.id != cronograma_id)) {
  CronogramasStore.getById(parentVar, parentField, cronograma_id);
}

const EtapasStore = useEtapasStore();
const { singleEtapa } = storeToRefs(EtapasStore);

EtapasStore.clearEdit();

const RegionsStore = useRegionsStore();
const { regions, tempRegions } = storeToRefs(RegionsStore);
if (!regions.length) RegionsStore.getAll();

let title = 'Adicionar etapa';

// levelN corresponde à propriedade `index` de cada região
const level1 = ref(null);
const level2 = ref(null);
const level3 = ref(null);
const regiao_id_mount = ref(null);

const minLevel = ref(0);

const acumulativa_iniciativa = ref(0);
const acumulativa_iniciativa_o = ref(0);
const acumulativa_meta = ref(0);
const acumulativa_meta_o = ref(0);

const lastParent = ref({});
const usersAvailable = ref([]);
const responsaveis = ref({ participantes: [], busca: '' });
const virtualParent = ref({});

if (etapa_id) {
  title = 'Editar etapa';
  if (!singleEtapa.value.id) {
    Promise.all([EtapasStore.getById(cronograma_id, etapa_id)]).then(() => {
      if (singleEtapa?.value?.etapa?.regiao_id) {
        (async () => {
          await RegionsStore.filterRegions({ id: singleEtapa.value.etapa.regiao_id });
          level1.value = tempRegions.value[0]?.children[0].index ?? null;
          level2.value = tempRegions.value[0]?.children[0]?.children[0].index ?? null;
          level3.value = tempRegions.value[0]?.children[0]?.children[0]?.children[0].index ?? null;

          if (level3.value) {
            minLevel.value = 3;
          } else if (level2.value) {
            minLevel.value = 2;
          } else if (level1.value) {
            minLevel.value = 1;
          }
        })();
      }
      if (singleEtapa.value.etapa.responsaveis) {
        responsaveis.value.participantes = singleEtapa.value.etapa.responsaveis.map((x) => x.id);
      }
    });
  }
}
(async () => {
  if (atividade_id) {
    if (atividade_id) await AtividadesStore.getById(iniciativa_id, atividade_id);
    lastParent.value = singleAtividade.value;
  } else if (iniciativa_id) {
    if (iniciativa_id) await IniciativasStore.getById(meta_id, iniciativa_id);
    lastParent.value = singleIniciativa.value;
  } else {
    if (!singleMeta.value?.id || singleMeta.value.id != meta_id) await MetasStore.getById(meta_id);
    lastParent.value = singleMeta.value;
  }
  if (lastParent.value.orgaos_participantes) {
    lastParent.value.orgaos_participantes.forEach((x) => {
      usersAvailable.value = usersAvailable.value.concat(x.participantes);
    });
  }

  if (etapa_id) {
    if (atividade_id) acumulativa_iniciativa.value = { loading: true };
    if (iniciativa_id) acumulativa_meta.value = { loading: true };

    let p_cron;
    let mon;

    if (atividade_id) {
      p_cron = await CronogramasStore.getItemByParent(iniciativa_id, 'iniciativa_id');
      mon = await EtapasStore.getMonitoramento(p_cron.id, etapa_id);
      if (mon) {
        acumulativa_iniciativa.value = !mon.inativo ? '1' : false;
        acumulativa_iniciativa_o.value = mon.ordem;
      }
    }
    if (iniciativa_id) {
      p_cron = await CronogramasStore.getItemByParent(meta_id, 'meta_id');
      mon = await EtapasStore.getMonitoramento(p_cron.id, etapa_id);
      if (mon) {
        acumulativa_meta.value = !mon.inativo ? '1' : false;
        acumulativa_meta_o.value = mon.ordem;
      }
    }
  }
})();

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.regiao_id = singleCronograma.value.regionalizavel && Number(values.regiao_id)
      ? Number(values.regiao_id)
      : null;
    values.ordem = Number(values.ordem) ?? null;
    values.etapa_pai_id = null;

    values.responsaveis = responsaveis.value.participantes;

    let rota = false;
    let etapa_id_gen = false;
    if (etapa_id) {
      if (singleEtapa.value.etapa_id == etapa_id) {
        r = await EtapasStore.update(etapa_id, values);
        msg = 'Dados salvos com sucesso!';
        rota = currentEdit;
        etapa_id_gen = etapa_id;

        if (values.ordem != singleEtapa.value.ordem) {
          EtapasStore.monitorar({
            cronograma_id: Number(cronograma_id),
            etapa_id: Number(etapa_id_gen),
            inativo: false,
            ordem: Number(values.ordem) ?? null,
          });
        }
      }
    } else {
      r = await EtapasStore.insert(Number(cronograma_id), values);
      msg = 'Item adicionado com sucesso!';
      rota = currentEdit;
      etapa_id_gen = r;
    }

    if (r) {
      if (etapa_id_gen) {
        if (values.acumulativa_iniciativa) {
          const ri = await CronogramasStore.getItemByParent(iniciativa_id, 'iniciativa_id');
          if (ri.id) {
            await EtapasStore.monitorar({
              cronograma_id: ri.id,
              etapa_id: Number(etapa_id_gen),
              inativo: !values.acumulativa_iniciativa,
              ordem: Number(values.acumulativa_iniciativa_o) ?? null,
            });
          }
        }
        if (values.acumulativa_meta) {
          const rm = await CronogramasStore.getItemByParent(meta_id, 'meta_id');
          if (rm.id) {
            await EtapasStore.monitorar({
              cronograma_id: rm.id,
              etapa_id: Number(etapa_id_gen),
              inativo: !values.acumulativa_meta,
              ordem: Number(values.acumulativa_meta_o) ?? null,
            });
          }
        }
      } else {
        throw 'Ocorreu um erro inesperado.';
      }

      EtapasStore.clear();
      CronogramasStore.clear();
      (async () => {
        await EtapasStore.getAll(cronograma_id);
        CronogramasStore.getById(parentVar, parentField, cronograma_id);
      })();

      alertStore.success(msg);
      editModalStore.clear();
      if (rota) router.push(rota);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.clear();
    alertStore.clear();
    router.go(-1);
  });
}
function lastlevel() {
  let r;
  if (singleCronograma.value.nivel_regionalizacao == 2 && level1.value !== null) {
    r = regions.value[0].children[level1.value].id;
  }
  if (singleCronograma.value.nivel_regionalizacao == 3 && level1.value !== null && level2.value !== null) {
    r = regions.value[0].children[level1.value].children[level2.value].id;
  }
  if (singleCronograma.value.nivel_regionalizacao == 4 && level1.value !== null && level2.value !== null && level3.value !== null) {
    r = regions.value[0].children[level1.value].children[level2.value].children[level3.value].id;
  }
  regiao_id_mount.value = r;
}
function maskDate(el) {
  const kC = event.keyCode;
  let data = el.target.value.replace(/[^0-9/]/g, '');
  if (kC != 8 && kC != 46) {
    if (data.length == 2) {
      el.target.value = data += '/';
    } else if (data.length == 5) {
      el.target.value = data += '/';
    } else {
      el.target.value = data;
    }
  }
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ title }}</h2>
    <hr class="ml2 f1">
    <button
      class="btn round ml2"
      @click="checkClose"
    >
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <template v-if="!(singleEtapa?.loading || singleEtapa?.error)&&singleCronograma?.id">
    <Form
      v-slot="{ errors, isSubmitting, values }"
      :validation-schema="schema"
      :initial-values="etapa_id ? singleEtapa.etapa : virtualParent"
      @submit="onSubmit"
    >
      <div>
        <label class="label">Nome <span class="tvermelho">*</span></label>
        <Field
          name="titulo"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors.titulo }"
        />
        <div class="error-msg">
          {{ errors.titulo }}
        </div>
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Ordem</label>
          <Field
            name="ordem"
            type="number"
            class="inputtext light mb1"
            :value="etapa_id ? singleEtapa?.ordem : ordem"
            :class="{ 'error': errors.ordem }"
          />
          <div class="error-msg">
            {{ errors.ordem }}
          </div>
        </div>
      </div>

      <div class="">
        <label class="label">Descrição</label>
        <Field
          name="descricao"
          as="textarea"
          rows="3"
          class="inputtext light mb1"
          :class="{ 'error': errors.descricao }"
        />
        <div class="error-msg">
          {{ errors.descricao }}
        </div>
      </div>

      <hr class="mt2 mb2">

      <label class="label">Responsável(eis)<span class="tvermelho">*</span></label>
      <div class="flex">
        <div class="f1">
          <AutocompleteField
            :controlador="responsaveis"
            :grupo="usersAvailable"
            label="nome_exibicao"
          />
        </div>
      </div>

      <hr class="mt2 mb2">
      <div v-if="singleCronograma.regionalizavel&&regions">
        <label class="label">Região</label>

        <template v-if="singleCronograma.nivel_regionalizacao >= 2">
          <select
            v-model="level1"
            class="inputtext light mb1"
            :disabled="
              minLevel >= 1 ||
                temDescendenteEmOutraRegião(values.regiao_id, values.etapa_filha)"
            @change="lastlevel"
          >
            <option value="">
              Selecione
            </option>
            <option
              v-for="(r,i) in regions[0]?.children"
              :key="i"
              :value="i"
            >
              {{ r.descricao }}
            </option>
          </select>
          <template
            v-if="singleCronograma.nivel_regionalizacao >= 3
              && level1 !== null"
          >
            <select
              v-model="level2"
              class="inputtext light mb1"
              :disabled="
                minLevel >= 2
                  || temDescendenteEmOutraRegião(values.regiao_id, values.etapa_filha)"
              @change="lastlevel"
            >
              <option value="">
                Selecione
              </option>
              <option
                v-for="(rr,ii) in regions[0]?.children[level1]?.children"
                :key="ii"
                :value="ii"
              >
                {{ rr.descricao }}
              </option>
            </select>
            <template
              v-if="singleCronograma.nivel_regionalizacao == 4
                && level2 !== null"
            >
              <select
                v-model="level3"
                class="inputtext light mb1"
                :disabled="
                  minLevel >= 3
                    || temDescendenteEmOutraRegião(values.regiao_id, values.etapa_filha)"
                @change="lastlevel"
              >
                <option value="">
                  Selecione
                </option>
                <option
                  v-for="(rrr,iii) in regions[0]?.children[level1]?.children[level2]?.children"
                  :key="iii"
                  :value="iii"
                >
                  {{ rrr.descricao }}
                </option>
              </select>
            </template>
            <template
              v-else-if="singleCronograma.nivel_regionalizacao == 4
                && level2 === null"
            >
              <input
                class="inputtext light mb1"
                type="text"
                disabled
                value="Selecione uma subprefeitura"
              >
            </template>
          </template>
          <template
            v-else-if="singleCronograma.nivel_regionalizacao >= 3
              && level1 === null"
          >
            <input
              class="inputtext light mb1"
              type="text"
              disabled
              value="Selecione uma região"
            >
          </template>
        </template>
        <Field
          v-model="regiao_id_mount"
          name="regiao_id"
          type="hidden"
          :class="{ 'error': errors.regiao_id }"
        />
        <div class="error-msg">
          {{ errors.regiao_id }}
        </div>
      </div>

      <hr class="mt2 mb2">

      <div class="flex g2">
        <div class="f1">
          <label class="label">Início previsto <span class="tvermelho">*</span></label>
          <Field
            name="inicio_previsto"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.inicio_previsto }"
            maxlength="10"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.inicio_previsto }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Término previsto <span class="tvermelho">*</span></label>
          <Field
            name="termino_previsto"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.termino_previsto }"
            maxlength="10"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.termino_previsto }}
          </div>
        </div>
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Início real</label>
          <Field
            name="inicio_real"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.inicio_real }"
            maxlength="10"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.inicio_real }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Término real</label>
          <Field
            name="termino_real"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.termino_real }"
            maxlength="10"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.termino_real }}
          </div>
        </div>
      </div>

      <template v-if="activePdm.possui_atividade">
        <div
          v-if="atividade_id && !acumulativa_iniciativa?.loading"
          class="flex center g2 mb2 mt1"
        >
          <div class="f2">
            <label class="block">
              <Field
                v-model="acumulativa_iniciativa"
                name="acumulativa_iniciativa"
                type="checkbox"
                value="1"
                class="inputcheckbox"
              />
              <span :class="{ 'error': errors.acumulativa_iniciativa }">
                Etapa monitorada no cronograma de {{ activePdm.rotulo_iniciativa }}
              </span>
            </label>
            <div class="error-msg">
              {{ errors.acumulativa_iniciativa }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Ordem</label>
            <Field
              v-model="acumulativa_iniciativa_o"
              name="acumulativa_iniciativa_o"
              type="number"
              class="inputtext light mb1"
            />
          </div>
        </div>
        <template v-else-if="acumulativa_iniciativa?.loading">
          <div class="spinner">
            Carregando
          </div>
        </template>
      </template>

      <template v-if="activePdm.possui_iniciativa">
        <div
          v-if="iniciativa_id && !acumulativa_meta?.loading"
          class="flex center g2 mb2 mt1"
        >
          <div class="f2">
            <label class="block">
              <Field
                v-model="acumulativa_meta"
                name="acumulativa_meta"
                type="checkbox"
                value="1"
                class="inputcheckbox"
              />
              <span :class="{ 'error': errors.acumulativa_meta }">
                Etapa monitorada no cronograma da meta
              </span>
            </label>
            <div class="error-msg">
              {{ errors.acumulativa_meta }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Ordem</label>
            <Field
              v-model="acumulativa_meta_o"
              name="acumulativa_meta_o"
              type="number"
              class="inputtext light mb1"
            />
          </div>
        </div>
        <template v-else-if="acumulativa_meta?.loading">
          <div class="spinner">
            Carregando
          </div>
        </template>
      </template>

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-if="singleEtapa?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="singleEtapa?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ singleEtapa.error ?? error }}
      </div>
    </div>
  </template>
</template>
