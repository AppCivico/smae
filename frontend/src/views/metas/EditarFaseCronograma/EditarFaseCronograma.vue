<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import MapaCampo from '@/components/geo/MapaCampo.vue';
import { fase as schema } from '@/consts/formSchemas';
import {
  useAlertStore, useAuthStore, useCronogramasStore, useEditModalStore, useEtapasStore, useRegionsStore,
} from '@/stores';
import { useEquipesStore } from '@/stores/equipes.store';
import temDescendenteEmOutraRegião from '../auxiliares/temDescendenteEmOutraRegiao.ts';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import CheckClose from '@/components/CheckClose.vue';

const authStore = useAuthStore();
const alertStore = useAlertStore();
const editModalStore = useEditModalStore();

const route = useRoute();
const router = useRouter();
// mantendo comportamento legado
// eslint-disable-next-line @typescript-eslint/naming-convention

const {
  meta_id,
  iniciativa_id,
  atividade_id,
  cronograma_id,
  etapa_id,
  fase_id,
  subfase_id,
} = route.params;

const props = defineProps(['group']);

const alertaDeExclusãoDeVariável = 'Atenção! Prosseguir excluirá a variável!';

const group = ref(props?.group);

const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
// mantendo comportamento legado
// eslint-disable-next-line no-nested-ternary
const parentField = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const currentEdit = route.path.slice(0, route.path.indexOf('/cronograma') + 11);

const CronogramasStore = useCronogramasStore();
const { singleCronograma } = storeToRefs(CronogramasStore);
if (
  cronograma_id
  // mantendo comportamento legado
  // eslint-disable-next-line eqeqeq
  && (!singleCronograma?.value?.id || singleCronograma?.value.id != cronograma_id)
) {
  CronogramasStore.getById(parentVar, parentField, cronograma_id);
}

const EtapasStore = useEtapasStore();
const { singleEtapa } = storeToRefs(EtapasStore);

const RegionsStore = useRegionsStore();
const { tempRegions } = storeToRefs(RegionsStore);

const EquipesStore = useEquipesStore();
EquipesStore.buscarTudo();
const { lista } = storeToRefs(EquipesStore);

const titulo = ref(`Adicionar ${group.value}`);
const level1 = ref(null);
const level2 = ref(null);
const level3 = ref(null);
// mantendo comportamento legado
// eslint-disable-next-line @typescript-eslint/naming-convention
const regiao_id_mount = ref(null);

const currentParent = group.value === 'subfase' ? fase_id : etapa_id;
const currentId = group.value === 'subfase' ? subfase_id : fase_id;
const currentFase = ref({
  peso: 1,
  percentual_execucao: 0,
});
const oktogo = ref(0);
const minLevel = ref(0);

const usersAvailable = ref([]);

const permissaoLiberada = computed(() => currentFase.value.pode_editar_realizado);

async function getRegionByParent(r_id, cur) {
  await RegionsStore.filterRegions({ id: r_id });

  level1.value = tempRegions.value[0]?.children[0].index !== undefined
    ? tempRegions.value[0]?.children[0].id
    : '';

  if (level1.value) {
    minLevel.value = 1;
  } else if (cur) {
    level1.value = cur;
  }

  level2.value = tempRegions.value[0]?.children[0]?.children[0].index !== undefined
    ? tempRegions.value[0]?.children[0]?.children[0].id
    : '';

  if (level2.value) {
    minLevel.value = 2;
    // mantendo comportamento legado
    // eslint-disable-next-line eqeqeq
  } else if (cur && cur != level1.value) {
    level2.value = cur;
  }

  level3.value = tempRegions.value[0]?.children[0]?.children[0]?.children[0].index !== undefined
    ? tempRegions.value[0]?.children[0]?.children[0]?.children[0].id
    : '';

  if (level3.value) {
    minLevel.value = 3;
    // mantendo comportamento legado
    // eslint-disable-next-line eqeqeq
  } else if (cur && cur != level2.value) {
    level3.value = cur;
  }
  // mantendo comportamento legado
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  lastlevel();
}

async function onSubmit(values) {
  try {
    let msg;
    let r;

    const concluirEnvio = async () => {
      values.regiao_id = singleCronograma.value.regionalizavel && Number(values.regiao_id)
        ? Number(values.regiao_id)
        : null;
      values.ordem = Number(values.ordem) ?? null;
      values.peso = Number(values.peso) ?? null;
      values.percentual_execucao = Number(values.percentual_execucao) ?? null;
      values.etapa_pai_id = currentParent;
      values.ps_ponto_focal = { equipes: values.equipes };
      delete values.equipes;

      let rota = false;
      // mantendo comportamento legado
      // eslint-disable-next-line @typescript-eslint/naming-convention
      let etapa_id_gen = null;
      if (currentId) {
        // mantendo comportamento legado
        // eslint-disable-next-line eqeqeq
        if (currentFase.value.id == currentId) {
          r = await EtapasStore.update(currentId, values);
          msg = 'Dados salvos com sucesso!';
          rota = currentEdit;
          etapa_id_gen = currentId;

          // mantendo comportamento legado
          // eslint-disable-next-line eqeqeq
          if (values.ordem != currentFase.value.ordem) {
            await EtapasStore.monitorar({
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
        EtapasStore.clear();
        CronogramasStore.clear();
        (async () => {
          await EtapasStore.getAll(cronograma_id);
          await CronogramasStore.getById(parentVar, parentField, cronograma_id);
          router.push(rota);
        })();
        alertStore.success(msg);
        editModalStore.clear();
      }
    };

    if (currentFase.value?.variavel?.id && !values.variavel) {
      alertStore.confirmAction(
        alertaDeExclusãoDeVariável,
        concluirEnvio,
        'Prosseguir',
      );
    } else {
      concluirEnvio();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function lastlevel() {
  let r;
  if (level1.value) {
    // mantendo comportamento legado
    // eslint-disable-next-line eqeqeq
    r = tempRegions.value[0]?.children.find((x) => x.id == level1.value)?.id;
  }
  if (level1.value && level2.value) {
    r = tempRegions.value[0]?.children
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      .find((x) => x.id == level1.value)?.children
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      .find((x) => x.id == level2.value)?.id;
  }
  if (level1.value && level2.value && level3.value) {
    r = tempRegions.value[0]?.children
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      .find((x) => x.id == level1.value)?.children
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      .find((x) => x.id == level2.value)?.children
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      .find((x) => x.id == level3.value)?.id;
  }
  regiao_id_mount.value = r;
}

function maskDate(el) {
  // mantendo comportamento legado
  // eslint-disable-next-line no-restricted-globals
  const kC = event.keyCode;
  let data = el.target.value.replace(/[^0-9/]/g, '');
  // mantendo comportamento legado
  // eslint-disable-next-line eqeqeq
  if (kC != 8 && kC != 46) {
    if (data.length === 2) {
      // mantendo comportamento legado
      // eslint-disable-next-line no-multi-assign
      el.target.value = data += '/';
    } else if (data.length === 5) {
      // mantendo comportamento legado
      // eslint-disable-next-line no-multi-assign
      el.target.value = data += '/';
    } else {
      el.target.value = data;
    }
  }
}

// @todo, talvez isso deva ser um helper?
function pegaPsTecnicoCpCompleto(idsDasEquipes = []) {
  const listaDeEquipes = lista.value;

  return listaDeEquipes.filter((equipe) => idsDasEquipes.includes(equipe.id));
}

const valoresIniciais = computed(() => (currentFase.value?.loading
  || currentFase.value?.error
  || !oktogo.value
  ? {
    variavel: null,
  }
  : {
    ...currentFase.value,
    geolocalizacao: currentFase.value?.geolocalizacao?.map((x) => x.token) || [],
    equipes: currentFase.value?.ps_ponto_focal?.equipes || [],
  }));

const geolocalizaçãoPorToken = computed(() => (currentFase.value?.loading
  || currentFase.value?.error
  || !oktogo.value
  ? {}
  : currentFase.value?.geolocalizacao?.reduce((acc, cur) => {
    acc[cur.token] = cur;
    return acc;
  }, {})
));

async function iniciar() {
  try {
    await EtapasStore.getById(cronograma_id, etapa_id);
    const p0 = singleEtapa.value.etapa;
    let pc;
    let p1;
    let noregion = true;

    if (group.value === 'subfase' && subfase_id) {
      titulo.value = 'Editar subfase';
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      p1 = await p0?.etapa_filha?.find((x) => x.id == fase_id) ?? {};
      pc = p1;
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      const p2 = p1?.etapa_filha?.find((x) => x.id == subfase_id) ?? {};
      currentFase.value = p2.id ? p2 : { error: 'Subfase não encontrada' };
      if (p1?.regiao_id) {
        getRegionByParent(p1.regiao_id, p2?.regiao_id);
        noregion = false;
      }
    } else if (group.value === 'subfase') {
      titulo.value = 'Adicionar subfase';
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      p1 = await p0?.etapa_filha?.find((x) => x.id == fase_id) ?? {};
      pc = p1;
      if (p1?.regiao_id) {
        getRegionByParent(p1.regiao_id);
        noregion = false;
      }
    } else if (group.value === 'fase' && fase_id) {
      titulo.value = `Editar ${group.value}`;
      pc = p0;
      // mantendo comportamento legado
      // eslint-disable-next-line eqeqeq
      p1 = await p0?.etapa_filha?.find((x) => x.id == fase_id) ?? {};
      currentFase.value = p1.id ? p1 : { error: 'Fase não encontrada' };
      if (p1?.regiao_id) {
        getRegionByParent(singleEtapa.value.etapa.regiao_id, p1?.regiao_id);
        noregion = false;
      }
    } else {
      pc = p0;
    }

    if (pc?.responsaveis) {
    // mantendo comportamento legado
    // eslint-disable-next-line no-nested-ternary
      usersAvailable.value = pc.responsaveis.map((x) => (x.id ? x : x.pessoa ? x.pessoa : null));
    }

    if (noregion && singleEtapa.value?.etapa?.regiao_id) {
      getRegionByParent(singleEtapa.value.etapa.regiao_id);
    }
    oktogo.value = 1;
  } catch (e) {
    console.error('ERRO', e);
  }
}

iniciar();
</script>

<template>
  <div class="minimodal">
    <div class="flex spacebetween center">
      <TituloDaPagina>
        {{ titulo }}
      </TituloDaPagina>

      <hr class="ml2 f1">

      <CheckClose />
    </div>

    <template v-if="!(currentFase?.loading || currentFase?.error) && oktogo">
      <Form
        v-slot="{ errors, isSubmitting, setFieldValue, values }"
        :validation-schema="schema"
        :initial-values="valoresIniciais"
        @submit="onSubmit"
      >
        <fieldset>
          <div>
            <LabelFromYup
              :schema="schema"
              name="titulo"
            />

            <Field
              name="titulo"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.titulo }"
              :disabled="!permissaoLiberada"
            />

            <ErrorMessage name="titulo" />
          </div>

          <div
            v-if="permissaoLiberada"
            class="flex g2"
          >
            <div class="f1">
              <LabelFromYup
                :schema="schema"
                name="ordem"
              />

              <Field
                name="ordem"
                type="number"
                class="inputtext light mb1"
                :class="{ 'error': errors.ordem }"
              />

              <ErrorMessage name="ordem" />
            </div>

            <div class="f1">
              <LabelFromYup
                :schema="schema"
                name="peso"
              />

              <Field
                name="peso"
                type="number"
                step="1"
                min="0"
                class="inputtext light mb1"
                :class="{ 'error': errors.peso }"
              />

              <ErrorMessage name="peso" />
            </div>
          </div>

          <div v-if="permissaoLiberada">
            <LabelFromYup
              :schema="schema"
              name="descricao"
            />

            <Field
              name="descricao"
              as="textarea"
              rows="3"
              class="inputtext light mb1"
              :class="{ 'error': errors.descricao }"
            />

            <ErrorMessage name="descricao" />
          </div>
        </fieldset>

        <fieldset v-if="permissaoLiberada">
          <div v-if="$route.meta.entidadeMãe === 'pdm'">
            <LabelFromYup
              :schema="schema"
              name="responsaveis"
            />

            <Field
              v-slot="{ value, handleChange }"
              name="responsaveis"
            >
              <AutocompleteField
                :controlador="{ participantes: value || [], busca: '' }"
                :grupo="usersAvailable"
                label="nome_exibicao"
                class="f1 mb1"
                @change="handleChange"
              />
            </Field>

            <ErrorMessage name="responsavel" />
          </div>

          <div v-if="['planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)">
            <LabelFromYup
              :schema="schema"
              name="equipes"
            />

            <Field
              v-slot="{ value, handleChange }"
              name="equipes"
            >
              <AutocompleteField
                class="flex mb1"
                :controlador="{
                  busca: '',
                  participantes: value || [],
                }"
                :grupo="pegaPsTecnicoCpCompleto(singleEtapa.etapa?.ps_ponto_focal?.equipes)"
                label="titulo"
                @change="handleChange"
              />
            </Field>

            <ErrorMessage name="equipes" />
          </div>
        </fieldset>

        <fieldset>
          <div
            v-if="permissaoLiberada && singleCronograma.regionalizavel && tempRegions.length"
            class="mb1"
          >
            <label class="label">Região</label>
            <select
              v-model="level1"
              class="inputtext light mb1"
              :disabled="minLevel >= 1
                || temDescendenteEmOutraRegião(values.regiao_id, values.etapa_filha, 1)"
              @change="lastlevel"
            >
              <option value="">
                Selecione
              </option>
              <option
                v-for="(r) in tempRegions[0]?.children"
                :key="r.id"
                :value="r.id"
              >
                {{ r.descricao }}
              </option>
            </select>
            <template v-if="level1 !== null">
              <select
                v-model="level2"
                class="inputtext light mb1"
                :disabled="minLevel >= 2
                  || temDescendenteEmOutraRegião(values.regiao_id, values.etapa_filha, 2)"
                @change="lastlevel"
              >
                <option value="">
                  Selecione
                </option>
                <option
                  v-for="(rr) in tempRegions[0]?.children.find(x => x.id == level1)?.children"
                  :key="rr.id"
                  :value="rr.id"
                >
                  {{ rr.descricao }}
                </option>
              </select>
              <template v-if="level2 !== null">
                <select
                  v-model="level3"
                  class="inputtext light mb1"
                  :disabled="minLevel >= 3
                    || temDescendenteEmOutraRegião(values.regiao_id, values.etapa_filha, 3)"
                  @change="lastlevel"
                >
                  <option value="">
                    Selecione
                  </option>
                  <option
                    v-for="(rrr) in tempRegions[0]?.children.find(x => x.id ==
                      level1)?.children.find(x => x.id == level2)?.children"
                    :key="rrr.id"
                    :value="rrr.id"
                  >
                    {{ rrr.descricao }}
                  </option>
                </select>
              </template>
              <template v-else>
                <input
                  class="inputtext light mb1"
                  type="text"
                  disabled
                  value="Selecione uma subprefeitura"
                >
              </template>
            </template>
            <template v-else>
              <input
                class="inputtext light mb1"
                type="text"
                disabled
                value="Selecione uma região"
              >
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

          <div class="mb1">
            <Field
              id="endereco_obrigatorio"
              name="endereco_obrigatorio"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              class="inputcheckbox"
              :disabled="!permissaoLiberada"
            />

            <LabelFromYup
              :schema="schema"
              name="endereco_obrigatorio"
              class="inline ml05"
            />

            <ErrorMessage name="endereco_obrigatorio" />
          </div>

          <div class="mb1">
            <LabelFromYup
              :schema="schema"
              name="geolocalizacao"
              as="legend"
            />

            <Field
              name="geolocalizacao"
            >
              <MapaCampo
                v-model="values.geolocalizacao"
                name="geolocalizacao"
                :geolocalização-por-token="geolocalizaçãoPorToken"
              />
            </Field>

            <ErrorMessage name="geolocalizacao" />
          </div>
        </fieldset>

        <fieldset v-if="permissaoLiberada">
          <div
            class="flex flexwrap g2"
          >
            <div class="fb100">
              <input
                id="associar-variavel"
                name="associar-variavel"
                type="checkbox"
                :checked="!!values.variavel"
                :value="{}"
                :unchecked-value="null"
                class="inputcheckbox"
                @change="ev =>
                  setFieldValue('variavel', ev.target.checked ?
                    {
                      codigo: valoresIniciais?.variavel?.codigo || '',
                      titulo: valoresIniciais?.variavel?.titulo || '',
                    } : null
                  )
                "
              >

              <label for="associar-variavel">
                Associar variável
              </label>
            </div>

            <div
              v-if="!!values.variavel"
              class="fb100 flex g2"
            >
              <div class="f1">
                <LabelFromYup
                  :schema="schema.fields.variavel"
                  :required="true"
                  name="codigo"
                />

                <Field
                  name="variavel.codigo"
                  type="text"
                  class="inputtext light mb1"
                  :class="{ 'error': errors['variavel.codigo'] }"
                  maxlength="60"
                />

                <ErrorMessage name="variavel.codigo" />
              </div>

              <div class="f1">
                <LabelFromYup
                  :schema="schema.fields.variavel"
                  :required="true"
                  name="titulo"
                />
                <Field
                  name="variavel.titulo"
                  type="text"
                  class="inputtext light mb1"
                  :class="{ 'error': errors['variavel.titulo'] }"
                  maxlength="256"
                />

                <ErrorMessage name="variavel.titulo" />
              </div>
            </div>

            <div
              v-if="valoresIniciais?.variavel?.id && !values.variavel"
              class="error-msg"
            >
              {{ alertaDeExclusãoDeVariável }}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <div
            v-if="permissaoLiberada"
            class="flex g2"
          >
            <div

              class="f1"
            >
              <LabelFromYup
                :schema="schema"
                name="inicio_previsto"
              />

              <Field
                name="inicio_previsto"
                type="text"
                class="inputtext light mb1"
                :class="{ 'error': errors.inicio_previsto }"
                maxlength="10"
                placeholder="dd/mm/aaaa"
                @keyup="maskDate"
              />

              <ErrorMessage name="inicio_previsto" />
            </div>

            <div class="f1">
              <LabelFromYup
                :schema="schema"
                name="termino_previsto"
              />

              <Field
                name="termino_previsto"
                type="text"
                class="inputtext light mb1"
                :class="{ 'error': errors.termino_previsto }"
                maxlength="10"
                placeholder="dd/mm/aaaa"
                @keyup="maskDate"
              />

              <ErrorMessage name="termino_previsto" />
            </div>
          </div>

          <div class="flex g2">
            <div class="f1">
              <LabelFromYup
                :schema="schema"
                name="inicio_real"
              />

              <Field
                name="inicio_real"
                type="text"
                class="inputtext light mb1"
                :class="{ 'error': errors.inicio_real }"
                maxlength="10"
                placeholder="dd/mm/aaaa"
                @keyup="maskDate"
              />

              <ErrorMessage name="inicio_real" />
            </div>

            <div class="f1">
              <LabelFromYup
                :schema="schema"
                name="termino_real"
              />

              <Field
                name="termino_real"
                type="text"
                class="inputtext light mb1"
                :class="{ 'error': errors.termino_real }"
                maxlength="10"
                placeholder="dd/mm/aaaa"
                @keyup="maskDate"
                @change="($e) => {
                  if (!currentFase.n_filhos_imediatos) {
                    setFieldValue('percentual_execucao', $e.target.value
                      ? 100
                      : valoresIniciais.percentual_execucao
                    );
                  }
                }"
              />

              <ErrorMessage name="termino_real" />
            </div>
          </div>

          <div class="flex g2">
            <div class="f1">
              <LabelFromYup
                :schema="schema"
                name="percentual_execucao"
              />

              <Field
                :disabled="values.n_filhos_imediatos"
                name="percentual_execucao"
                type="number"
                step="1"
                min="0"
                max="100"
                class="inputtext light mb1"
                :class="{ 'error': errors.percentual_execucao }"
              />

              <ErrorMessage name="percentual_execucao" />
            </div>

            <div
              class="f1"
              type="hidden"
            >
              <span />
            </div>
          </div>
        </fieldset>

        <FormErrorsList :errors="errors" />

        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">

          <button
            class="btn big"
            type="submit"
            :disabled="isSubmitting || Object.keys(errors)?.length"
          >
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </Form>
    </template>

    <template v-if="currentFase?.loading || !oktogo">
      <span class="spinner">Carregando</span>
    </template>

    <template v-if="currentFase?.error">
      <div class="error p1">
        <div class="error-msg">
          {{ currentFase.error }}
        </div>
      </div>
    </template>
  </div>
</template>
