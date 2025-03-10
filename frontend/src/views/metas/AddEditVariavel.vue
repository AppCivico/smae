<script setup>
import { variável } from '@/consts/formSchemas';
import fieldToDate from '@/helpers/fieldToDate';
import maskMonth from '@/helpers/maskMonth';
import truncate from '@/helpers/texto/truncate';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { useIniciativasStore } from '@/stores/iniciativas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useResourcesStore } from '@/stores/resources.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const resourcesStore = useResourcesStore();
const { resources } = storeToRefs(resourcesStore);

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;
const { indicador_id } = route.params;

const { funçãoDaTela } = route.meta;

const { var_id } = route.params;
const { copy_id } = route.params;

const currentEdit = route.path.slice(0, route.path.indexOf('/variaveis'));

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const IndicadoresStore = useIndicadoresStore();
const { singleIndicadores } = storeToRefs(IndicadoresStore);

const lastParent = ref({});

const VariaveisStore = useVariaveisStore();
const { singleVariaveis } = storeToRefs(VariaveisStore);
VariaveisStore.clearEdit();

const RegionsStore = useRegionsStore();
const { regions, regiõesPorNívelOrdenadas, tempRegions } = storeToRefs(RegionsStore);

if (!resources.length) {
  resourcesStore.getAll();
}

let title = var_id ? 'Editar variável' : 'Adicionar variável';
const responsaveisArr = ref({ participantes: [], busca: '' });
const orgao_id = ref(0);
const level1 = ref(null);
const level2 = ref(null);
const level3 = ref(null);
const regiao_id_mount = ref(null);
const periodicidade = ref(null);
const regiõesSelecionadas = ref([]);

const virtualParent = ref({});

const schema = computed(() => variável(singleIndicadores));

const regiõesDisponíveis = computed(() => (Array.isArray(regiõesPorNívelOrdenadas.value?.[
  singleIndicadores.value.nivel_regionalizacao
])
  ? regiõesPorNívelOrdenadas.value[singleIndicadores.value.nivel_regionalizacao]
  : []));

const idsDasRegiõesVálidas = computed(() => regiõesDisponíveis.value
  .reduce((acc, cur) => {
    if (cur.pdm_codigo_sufixo) {
      acc.push(cur.id);
    }
    return acc;
  }, []));

const estãoTodasAsRegiõesSelecionadas = computed({
  get() {
    return regiõesSelecionadas.value?.length
      && regiõesSelecionadas.value.length === regiõesDisponíveis.value.length;
  },
  // eslint-disable-next-line padded-blocks
  set(novoValor) {
    // Não é bonito, mas é o único jeito que achei do framework não confundir a
    // redefinição com um push;
    if (novoValor) {
      regiõesSelecionadas.value
        .splice(0, regiõesSelecionadas.value.length, ...idsDasRegiõesVálidas.value);
    } else {
      regiõesSelecionadas.value.splice(0);
    }
  },
});

async function onSubmit(values) {
  const carga = values;

  try {
    let msg;
    let r;

    if (!responsaveisArr.value.participantes.length) throw 'Selecione ao menos um responsável';

    carga.acumulativa = !!carga.acumulativa;
    carga.indicador_id = Number(indicador_id);

    carga.orgao_id = Number(carga.orgao_id);

    if (funçãoDaTela !== 'gerar') {
      carga.regiao_id = singleIndicadores.value.regionalizavel ? Number(carga.regiao_id) : null;
    }

    carga.unidade_medida_id = Number(carga.unidade_medida_id);
    carga.ano_base = Number(carga.ano_base) ?? null;
    carga.casas_decimais = Number(carga.casas_decimais);
    carga.atraso_meses = carga.atraso_meses ? Number(carga.atraso_meses) : 1;
    carga.responsaveis = responsaveisArr.value.participantes;

    carga.inicio_medicao = fieldToDate(carga.inicio_medicao);
    carga.fim_medicao = fieldToDate(carga.fim_medicao);

    let rota = false;
    if (var_id) {
      if (singleVariaveis.value.id == var_id) {
        r = await VariaveisStore.update(var_id, carga);
        msg = 'Dados salvos com sucesso!';
        rota = currentEdit;
      }
    } else if (funçãoDaTela === 'gerar') {
      r = await VariaveisStore.gerar(carga);
      msg = 'Variáveis geradas!';
      rota = currentEdit;
    } else {
      r = await VariaveisStore.insert(carga);
      msg = 'Item adicionado com sucesso!';
      rota = `${currentEdit}/variaveis/${r}/valores`;
    }

    if (r) {
      VariaveisStore.clear();
      VariaveisStore.getAll(indicador_id);
      alertStore.success(msg);
      editModalStore.clear();

      if (route.meta.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      } else if (route.meta.entidadeMãe === 'pdm') {
        if (rota) router.push(rota);
      } else {
        throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.clear();
    alertStore.clear();
    if (route.meta.rotaDeEscape) {
      router.push({
        name: route.meta.rotaDeEscape,
        params: route.params,
        query: route.query,
      });
    } else {
      router.go(-1);
    }
  });
}
function lastlevel() {
  let r;
  if (singleIndicadores.value.nivel_regionalizacao == 2 && level1.value !== null) {
    r = regions.value[0].children[level1.value].id;
  }
  if (
    singleIndicadores.value.nivel_regionalizacao == 3
    && level1.value !== null
    && level2.value !== null
  ) {
    r = regions.value[0].children[level1.value].children[level2.value].id;
  }
  if (
    singleIndicadores.value.nivel_regionalizacao == 4
    && level1.value !== null
    && level2.value !== null && level3.value !== null
  ) {
    r = regions.value[0].children[level1.value].children[level2.value].children[level3.value].id;
  }
  regiao_id_mount.value = r;
}
function pushId(e, id) {
  e.push(id);
  e = [...new Set(e)];
}
function removeParticipante(item, p) {
  item.participantes.splice(item.participantes.indexOf(p), 1);
}
function buscaCoord(e, parent, item) {
  e.preventDefault();
  e.stopPropagation();
  if (e.keyCode === 13) {
    const i = parent
      .find((x) => !item.participantes.includes(x.id) && x.nome_exibicao.toLowerCase().includes(item.busca.toLowerCase()));
    if (i) pushId(item.participantes, i.id);
    item.busca = '';
  }
}

(async () => {
  regiõesSelecionadas.value = [];

  if (atividade_id) {
    if (atividade_id) {
      await AtividadesStore.getById(iniciativa_id, atividade_id);
    }
    lastParent.value = singleAtividade.value;
  } else if (iniciativa_id) {
    if (iniciativa_id) {
      await IniciativasStore.getById(meta_id, iniciativa_id);
    }
    lastParent.value = singleIniciativa.value;
  } else {
    if (!singleMeta.value?.id || singleMeta.value.id != meta_id) {
      await MetasStore.getById(meta_id);
    }
    lastParent.value = singleMeta.value;
  }

  if (indicador_id && (!singleIndicadores?.id || singleIndicadores.id != indicador_id)) {
    await IndicadoresStore.getById(indicador_id);
  }
  periodicidade.value = singleIndicadores.value.periodicidade;

  if (var_id) {
    title = 'Editar variável';
    if (!singleVariaveis.value.id) {
      await VariaveisStore.getById(indicador_id, var_id);

      responsaveisArr.value.participantes = singleVariaveis.value?.responsaveis
        .map((x) => x.id) ?? [];
      orgao_id.value = singleVariaveis.value?.orgao_id;
      periodicidade.value = singleVariaveis.value.periodicidade;

      if (singleVariaveis.value?.regiao_id) {
        if (singleVariaveis.value.regiao_id) {
          await RegionsStore.filterRegions({ id: singleVariaveis.value.regiao_id });
          level1.value = tempRegions.value[0]?.children[0].index ?? null;
          level2.value = tempRegions.value[0]?.children[0]?.children[0].index ?? null;
          level3.value = tempRegions.value[0]?.children[0]?.children[0]?.children[0].index ?? null;
        }
      }
    }
  } else if (copy_id) {
    if (!singleVariaveis.value.id) {
      await VariaveisStore.getById(indicador_id, copy_id);

      responsaveisArr.value.participantes = singleVariaveis.value?.responsaveis
        .map((x) => x.id) ?? [];
      orgao_id.value = singleVariaveis.value?.orgao_id;

      if (singleVariaveis.value?.regiao_id) {
        if (singleVariaveis.value.regiao_id) {
          await RegionsStore.filterRegions({ id: singleVariaveis.value.regiao_id });

          level1.value = tempRegions.value[0]?.children[0].index ?? null;
          level2.value = tempRegions.value[0]?.children[0]?.children[0].index ?? null;
          level3.value = tempRegions.value[0]?.children[0]?.children[0]?.children[0].index ?? null;

          virtualParent.value.regiao_id = singleVariaveis.value.regiao_id;
        }
      }
      virtualParent.value.acumulativa = singleVariaveis.value.acumulativa;
      virtualParent.value.casas_decimais = singleVariaveis.value.casas_decimais;
      virtualParent.value.atraso_meses = singleVariaveis.value.atraso_meses ?? 1;
      virtualParent.value.orgao_id = singleVariaveis.value.orgao_id;
      virtualParent.value.periodicidade = singleVariaveis.value.periodicidade;
      periodicidade.value = singleVariaveis.value.periodicidade;
      virtualParent.value.responsaveis = singleVariaveis.value.responsaveis;
      virtualParent.value.unidade_medida_id = singleVariaveis.value.unidade_medida_id;
      virtualParent.value.valor_base = singleVariaveis.value.valor_base;
    }
  } else {
    virtualParent.value.atraso_meses = 1;
  }

  if (!regions.length) {
    await RegionsStore.getAll();
  }

  estãoTodasAsRegiõesSelecionadas.value = true;
})();
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
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

  <template
    v-if="!(singleVariaveis?.loading || singleVariaveis?.error)
      && singleIndicadores?.id && lastParent?.id"
  >
    <Form
      v-slot="{ errors, isSubmitting, values }"
      :validation-schema="schema"
      :initial-values="var_id ? singleVariaveis : virtualParent"
      @submit="onSubmit"
    >
      <div class="flex g2">
        <div class="f0">
          <label class="label">
            Código <span class="tvermelho">*</span>
          </label>
          <Field
            name="codigo"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.codigo }"
          />
          <div class="error-msg">
            {{ errors.codigo }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Título <span class="tvermelho">*</span></label>
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
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Valor base <span class="tvermelho">*</span></label>
          <Field
            name="valor_base"
            type="number"
            class="inputtext light mb1"
            :class="{ 'error': errors.valor_base }"
          />
          <div class="error-msg">
            {{ errors.valor_base }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Ano base</label>
          <Field
            name="ano_base"
            type="number"
            class="inputtext light mb1"
            :class="{ 'error': errors.ano_base }"
          />
          <div class="error-msg">
            {{ errors.ano_base }}
          </div>
        </div>
      </div>

      <div class="flex g2">
        <div class="f1">
          <label class="label flex center">Periodicidade <span class="tvermelho">*</span></label>
          <Field
            v-model="periodicidade"
            name="periodicidade"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.periodicidade }"
          >
            <option value="">
              Selecionar
            </option>
            <option value="Mensal">
              Mensal
            </option>
            <option value="Bimestral">
              Bimestral
            </option>
            <option value="Trimestral">
              Trimestral
            </option>
            <option value="Quadrimestral">
              Quadrimestral
            </option>
            <option value="Semestral">
              Semestral
            </option>
            <option value="Anual">
              Anual
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.periodicidade }}
          </div>
        </div>
        <div
          v-if="singleIndicadores?.periodicidade != values.periodicidade"
          class="f1"
        >
          <label class="label">Início da Medição <span class="tvermelho">*</span></label>
          <Field
            name="inicio_medicao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.inicio_medicao }"
            maxlength="7"
            placeholder="mm/aaaa"
            @keyup="maskMonth"
          />
          <div class="error-msg">
            {{ errors.inicio_medicao }}
          </div>
        </div>
        <div
          v-if="singleIndicadores?.periodicidade != periodicidade"
          class="f1"
        >
          <label class="label">Fim da Medição <span class="tvermelho">*</span></label>
          <Field
            name="fim_medicao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.fim_medicao }"
            maxlength="7"
            placeholder="mm/aaaa"
            @keyup="maskMonth"
          />
          <div class="error-msg">
            {{ errors.fim_medicao }}
          </div>
        </div>
      </div>

      <div class="flex g2">
        <div class="f2">
          <label class="label">Unidade <span class="tvermelho">*</span></label>
          <Field
            name="unidade_medida_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.unidade_medida_id }"
          >
            <option value="">
              Selecione
            </option>
            <option
              v-for="unidade in resources"
              :key="unidade.id"
              :value="unidade.id"
            >
              {{ unidade.sigla }} - {{ unidade.descricao }}
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.unidade_medida_id }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Casas decimais</label>
          <Field
            name="casas_decimais"
            type="number"
            min="0"
            class="inputtext light mb1"
            :class="{ 'error': errors.casas_decimais }"
          />
          <div class="error-msg">
            {{ errors.casas_decimais }}
          </div>
        </div>
        <div class="f2">
          <label class="label">
            Defasagem da medição &nbsp;<span class="tvermelho">*</span>
          </label>
          <Field
            name="atraso_meses"
            type="number"
            min="0"
            step="1"
            class="inputtext light mb1"
            :class="{ 'error': errors.atraso_meses }"
          />
          <div class="error-msg">
            {{ errors.atraso_meses }}
          </div>
        </div>
      </div>
      <div class="mb2 mt1">
        <label class="block">
          <Field
            name="acumulativa"
            type="checkbox"
            value="1"
            class="inputcheckbox"
          /><span :class="{ 'error': errors.acumulativa }">Variável acumulativa</span>
        </label>
        <div class="error-msg">
          {{ errors.acumulativa }}
        </div>
      </div>
      <div v-if="lastParent?.orgaos_participantes?.length">
        <label class="label">Órgão responsável <span class="tvermelho">*</span></label>
        <Field
          v-if="lastParent?.id"
          v-model="orgao_id"
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.orgao_id }"
          @change="responsaveisArr.participantes.splice(0)"
        >
          <option
            v-for="a in lastParent.orgaos_participantes"
            :key="a.orgao.id"
            :value="a.orgao.id"
            :title="a.orgao.descricao?.length > 36 ? a.orgao.descricao : null"
          >
            {{ a.orgao.sigla }} - {{ truncate(a.orgao.descricao, 36) }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.orgao_id }}
        </div>

        <label class="label">Responsável <span class="tvermelho">*</span></label>
        <div
          v-if="lastParent?.orgaos_participantes?.length&&orgao_id"
          class="mb1"
        >
          <textarea
            v-ScrollLockDebug
            cols="30"
            rows="10"
          >
lastParent.orgaos_participantes:{{ lastParent.orgaos_participantes }}</textarea>
          <pre v-ScrollLockDebug>orgao_id:{{ orgao_id }}</pre>

          <template
            v-for="(c, i) in [lastParent.orgaos_participantes.find((x) => x.orgao.id == orgao_id)]"
            :key="c?.orgao?.id || i"
          >
            <template v-if="c && c.orgao">
              <div class="suggestion search">
                <input
                  v-model="responsaveisArr.busca"
                  type="text"
                  class="inputtext light mb05"
                  @keyup.enter.stop.prevent="buscaCoord($event,c.participantes,responsaveisArr)"
                >
                <ul v-if="c?.participantes">
                  <li
                    v-for="r in c?.participantes.filter(x=>!responsaveisArr.participantes.includes(x.id)&&x.nome_exibicao.toLowerCase().includes(responsaveisArr.busca.toLowerCase()))"
                    :key="r.id"
                  >
                    <a
                      tabindex="1"
                      @click="pushId(responsaveisArr.participantes,r.id)"
                    >{{ r.nome_exibicao }}</a>
                  </li>
                </ul>
              </div>
              <div v-if="c?.participantes">
                <span
                  v-for="p in c?.participantes.filter(x=>responsaveisArr.participantes.includes(x.id))"
                  :key="p.id"
                  class="tagsmall"
                  @click="removeParticipante(responsaveisArr,p.id)"
                >{{ p.nome_exibicao }}<svg
                  width="12"
                  height="12"
                ><use xlink:href="#i_x" /></svg></span>
              </div>
            </template>
            <ErrorComponent v-else>
              Órgão <code>{{ orgao_id }}</code> ausente dos participantes.
            </ErrorComponent>
          </template>
        </div>
        <input
          v-else
          class="inputtext light mb1"
          type="text"
          disabled
          value="Selecione um órgão"
        >
      </div>

      <div
        v-if="funçãoDaTela === 'gerar'"
        class="mb1"
      >
        <pre v-ScrollLockDebug>values.regioes:{{ values.regioes }}</pre>
        <pre v-ScrollLockDebug>regiõesSelecionadas:{{ regiõesSelecionadas }}</pre>

        <div class="flex spacebetween center mb2">
          <legend class="label mt2 mb1">
            Regiões abrangidas
          </legend>
          <hr class="ml2 f1">
          <label class="ml2">
            <input
              v-model="estãoTodasAsRegiõesSelecionadas"
              type="checkbox"
              name=""
              :value="true"
              class="inputcheckbox interruptor"
            >
            <span v-if="estãoTodasAsRegiõesSelecionadas">
              Limpar seleção
            </span>
            <span v-else>
              Selecionar todas
            </span>
          </label>
        </div>

        <div class="flex flexwrap g1 lista-de-opções">
          <label
            v-for="r in regiõesDisponíveis"
            :key="r.id"
            class="tc600 lista-de-opções__item"
            :title="!r.pdm_codigo_sufixo ? 'Região sem código de sufixo' : undefined"
          >
            <Field
              v-model="regiõesSelecionadas"
              name="regioes"
              :value="r.id"
              type="checkbox"
              class="inputcheckbox"
              :disabled="!r.pdm_codigo_sufixo"
              :class="{ 'error': errors['parametros.tipo'] }"
            />
            <span>
              {{ r.descricao }}
            </span>
          </label>
        </div>

        <div class="mb2 mt2">
          <label class="block">
            <Field
              name="supraregional"
              type="checkbox"
              :value="true"
              class="inputcheckbox"
            /><span :class="{ 'error': errors.supraregional }">
              Incluir variável supra regional
            </span>
          </label>
          <div class="error-msg">
            {{ errors.supraregional }}
          </div>
        </div>
      </div>

      <div v-else-if="singleIndicadores.regionalizavel && regions">
        <label class="label">Região</label>
        <template v-if="singleIndicadores.nivel_regionalizacao >= 2">
          <select
            v-model="level1"
            class="inputtext light mb1"
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
            v-if="singleIndicadores.nivel_regionalizacao >= 3 && level1
              !== null"
          >
            <select
              v-model="level2"
              class="inputtext light mb1"
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
              v-if="singleIndicadores.nivel_regionalizacao == 4 &&
                level2 !== null"
            >
              <select
                v-model="level3"
                class="inputtext light mb1"
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
            <template v-else-if="singleIndicadores.nivel_regionalizacao == 4 && level2 === null">
              <input
                class="inputtext light mb1"
                type="text"
                disabled
                value="Selecione uma subprefeitura"
              >
            </template>
          </template>
          <template v-else-if="singleIndicadores.nivel_regionalizacao >= 3 && level1 === null">
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

      <div
        v-if="var_id"
        class="mb2 mt1"
      >
        <label class="block">
          <Field
            name="suspendida"
            type="checkbox"
            :value="true"
            class="inputcheckbox"
          /><span :class="{ 'error': errors.suspendida }">
            {{ schema.fields.suspendida.spec.label }}
          </span>
        </label>
        <div class="error-msg">
          {{ errors.suspendida }}
        </div>
      </div>

      <FormErrorsList :errors="errors" />

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
  <template v-if="singleVariaveis?.loading || lastParent?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="singleVariaveis?.error || lastParent?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ singleVariaveis.error ?? lastParent?.error }}
      </div>
    </div>
  </template>
</template>

<style lang="less">
.lista-de-opções {}

.lista-de-opções__item {
  flex-basis: 20%;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
