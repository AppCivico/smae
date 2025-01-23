<script setup>
import ItensRealizado from '@/components/orcamento/ItensRealizado.vue';
import ListaDeCompartilhamentos from '@/components/orcamento/ListaDeCompartilhamentos.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useIniciativasStore } from '@/stores/iniciativas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { Field, useForm } from 'vee-validate';
import {
  defineOptions, ref, toRaw, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as Yup from 'yup';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  parametrosParaValidacao: {
    type: Object,
    required: true,
  },
});

const alertStore = useAlertStore();
const DotaçãoStore = useDotaçãoStore();
const ProjetoStore = useProjetosStore();
const route = useRoute();
const router = useRouter();
const { meta_id } = route.params;
const { ano } = route.params;
const { id } = route.params;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado } = storeToRefs(OrcamentosStore);

const currentEdit = ref({
  itens: [],
});
const dota = ref('');
const dotaAno = ref(ano);
const respostasof = ref({});
const validando = ref(false);

const regdota = /^\d{1,6}$/;
const schema = Yup.object().shape({
  nota_empenho: Yup.string().required('Preencha o nota_empenho.').matches(regdota, 'Formato inválido'),
  dotacao: Yup.string(),
  processo: Yup.string(),
});

const {
  errors, handleSubmit, isSubmitting, resetForm, values, validateField,
} = useForm({
  initialValues: currentEdit.value,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  const nota_empenho_e_ano = `${values.nota_empenho}/${dotaAno.value}`;

  if (respostasof.value.nota_empenho !== nota_empenho_e_ano) {
    validarDota();
    return;
  }

  try {
    let msg;
    let r;

    values.ano_referencia = Number(ano);

    if (values.location) {
      values.atividade_id = null;
      values.iniciativa_id = null;
      values.meta_id = null;

      if (values.location[0] == 'a') {
        values.atividade_id = Number(values.location.slice(1));
      } else if (values.location[0] == 'i') {
        values.iniciativa_id = Number(values.location.slice(1));
      } else if (values.location[0] == 'm') {
        values.meta_id = Number(values.location.slice(1));
      }
    }

    // sobrescrever propriedade `nota_empenho`
    r = await OrcamentosStore.insertOrcamentoRealizado({ ...values, nota_empenho: nota_empenho_e_ano });
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      alertStore.success(msg);
      if (route.meta?.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          query: route.query,
        });
      } else {
        await router.push({
          path: `${parentlink}/orcamento/realizado`,
          query: route.query,
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await OrcamentosStore.deleteOrcamentoRealizado(id, route.params)) {
      if (parentlink) {
        router.push({
          path: `${parentlink}/orcamento`,
          query: route.query,
        });
      } else if (route.meta?.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          query: route.query,
        });
      }
    }
  }, 'Remover');
}
function dinheiro(v) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(v));
}
function toFloat(v) {
  return isNaN(v) || String(v).indexOf(',') !== -1 ? Number(String(v).replace(/[^0-9\,]/g, '').replace(',', '.')) : Math.round(Number(v) * 100) / 100;
}
function maskNota(el) {
  el.target.value = formatNota(el.target.value);
}
function formatNota(d) {
  const data = String(d).replace(/[\D]/g, '').slice(0, 6);
  const s = data.slice(0, 6);
  return s;
}

async function validarDota(evt) {
  validando.value = true;
  dota.value = String(dota.value).padStart(6, '0');

  try {
    respostasof.value = { loading: true };
    const { valid } = await validateField('nota_empenho');
    if (valid) {
      const r = await DotaçãoStore
        .getDotaçãoRealizadoNota(
          `${dota.value}/${dotaAno.value}`,
          dotaAno.value,
          props.parametrosParaValidacao,
        );
      respostasof.value = r;

      [dota.value] = r.nota_empenho && r.nota_empenho.indexOf('/') !== -1
        ? r.nota_empenho.split('/')
        : r.nota_empenho;
    }
  } catch (error) {
    respostasof.value = error;
  }

  if (evt?.stopPropagation) {
    evt.stopPropagation();
  }
  validando.value = false;
}

watch(currentEdit, (novosValores) => {
  resetForm({ values: toRaw(novosValores) });
});
</script>
<template>
  <div class="flex spacebetween center">
    <h1>Empenho/Liquidação</h1>
    <hr class="ml2 f1">

    <CheckClose />
  </div>
  <h3 class="mb2">
    <strong>{{ ano }}</strong> - {{ parent_item.codigo }} - {{ parent_item.titulo }}
  </h3>
  <template v-if="!(OrcamentoRealizado[ano]?.loading || OrcamentoRealizado[ano]?.error)">
    <form
      @submit.prevent="onSubmit"
    >
      <div class="flex center g2">
        <div class="f1">
          <label class="label">Nota de empenho <span class="tvermelho">*</span></label>
          <Field
            v-model="dota"
            name="nota_empenho"
            type="text"
            class="inputtext light mb1"
            :class="{
              error: errors.nota_empenho || respostasof.informacao_valida === false,
              loading: respostasof.loading
            }"
            :aria-busy="validando"
            @keyup="maskNota"
            @keyup.enter="validarDota()"
          />
          <div class="error-msg">
            {{ errors.nota_empenho }}
          </div>
          <div
            v-if="respostasof.loading"
            class="t13 mb1 tc300"
          >
            Aguardando resposta do SOF
          </div>
          <div
            v-if="respostasof.informacao_valida === false"
            class="t13 mb1 tvermelho"
          >
            Dotação não encontrada
          </div>
        </div>

        <div class="f1">
          <label class="label">Ano da nota de empenho <span
            class="tvermelho"
          >*</span></label>

          <Field
            v-model="dotaAno"
            name="nota_ano"
            type="number"
            list="foobar"
            min="2003"
            :max="ano"
            class="inputtext light mb1"
            :class="{
              'error':
                errors.nota_ano || respostasof.informacao_valida === false,
              'loading': respostasof.loading
            }"
            :aria-busy="validando"
            @keyup.enter="validarDota()"
          />
          <div class="error-msg">
            {{ errors.nota_ano }}
          </div>
          <div
            v-if="respostasof.loading"
            class="t13 mb1 tc300"
          >
            Aguardando resposta do SOF
          </div>
          <div
            v-if="respostasof.informacao_valida === false"
            class="t13 mb1 tvermelho"
          >
            Dotação não encontrada
          </div>
        </div>
        <div class="f0">
          <button
            type="button"
            :aria-busy="validando"
            :aria-disabled="validando"
            class="btn outline bgnone tcprimary"
            @click="validarDota()"
          >
            Validar via SOF
          </button>
        </div>
      </div>

      <template v-if="respostasof.dotacao != undefined">
        <Field
          name="dotacao"
          type="hidden"
          :value="respostasof.dotacao"
          class="inputcheckbox"
        />
        <Field
          name="processo"
          type="hidden"
          :value="respostasof.processo"
          class="inputcheckbox"
        />
        <table class="tablemain fix mb4">
          <thead>
            <tr>
              <th style="width: 20%">
                Dotação
              </th>
              <th style="width: 20%">
                Processo
              </th>
              <th style="width: 50%">
                Nome do projeto/atividade
              </th>
              <th style="width: 120px">
                Empenho SOF
              </th>
              <th style="width: 120px">
                Liquidação SOF
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ respostasof.dotacao }}</td>
              <td>{{ respostasof.processo }}</td>
              <td class="w700">
                {{ respostasof.projeto_atividade }}
              </td>
              <td>R$ {{ dinheiro(toFloat(respostasof.empenho_liquido)) }}</td>
              <td>R$ {{ dinheiro(toFloat(respostasof.valor_liquidado)) }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-if="respostasof.dotacao">
        <ListaDeCompartilhamentos
          v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe) && respostasof.dotacao"
          :ano="ano"
          :pdm="activePdm.id"
          :dotação="values.dotacao"
          :processo="values.processo"
          :nota-empenho="`${values.nota_empenho}/${values.nota_ano}`"
          class="mb1"
        />

        <div v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)">
          <label class="label">Vincular dotação<span class="tvermelho">*</span></label>

          <div
            v-for="m in singleMeta.children"
            :key="m.id"
          >
            <div class="label tc300">
              Meta
            </div>
            <label class="block mb1">
              <Field
                name="location"
                type="radio"
                :value="'m' + m.id"
                class="inputcheckbox"
              />
              <span>{{ m.codigo }} - {{ m.titulo }}</span>
            </label>
            <template v-if="['Iniciativa', 'Atividade'].indexOf(activePdm.nivel_orcamento) != -1">
              <div
                v-if="m?.iniciativas?.length"
                class="label tc300"
              >
                {{ activePdm.rotulo_iniciativa }}{{ ['Atividade'].indexOf(activePdm.nivel_orcamento) != -1
                  ? ' e ' + activePdm.rotulo_atividade
                  : '' }}
              </div>
              <div
                v-for="i in m.iniciativas"
                :key="i.id"
                class=""
              >
                <label class="block mb1">
                  <Field
                    name="location"
                    type="radio"
                    :value="'i' + i.id"
                    class="inputcheckbox"
                  />
                  <span>{{ i.codigo }} - {{ i.titulo }}</span>
                </label>
                <template v-if="activePdm.nivel_orcamento == 'Atividade'">
                  <div
                    v-for="a in i.atividades"
                    :key="a.id"
                    class="pl2"
                  >
                    <label class="block mb1">
                      <Field
                        name="location"
                        type="radio"
                        :value="'a' + a.id"
                        class="inputcheckbox"
                      />
                      <span>{{ a.codigo }} - {{ a.titulo }}</span>
                    </label>
                  </div>
                </template>
              </div>
            </template>
          </div>
          <div class="error-msg">
            {{ errors.location }}
          </div>
        </div>

        <ItensRealizado
          v-model="values.itens"
          :respostasof="respostasof"
          name="itens"
        />

        <div
          v-show="respostasof.nota_empenho !== `${values.nota_empenho}/${dotaAno}`"
          class="error-msg"
        >
          Validação pendente
        </div>

        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button
            class="btn big"
            :disabled="isSubmitting
              || respostasof.nota_empenho !== `${values.nota_empenho}/${dotaAno}`"
          >
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </template>
    </form>
  </template>
  <template v-if="currentEdit && currentEdit?.id">
    <button
      class="btn amarelo big"
      @click="checkDelete(currentEdit.id)"
    >
      Remover item
    </button>
  </template>
  <template v-if="OrcamentoRealizado[ano]?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="OrcamentoRealizado[ano]?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ OrcamentoRealizado[ano].error }}
      </div>
    </div>
  </template>
</template>
