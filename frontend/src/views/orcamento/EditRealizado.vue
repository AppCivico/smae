<script setup>
import ItensRealizado from '@/components/orcamento/ItensRealizado.vue';
import ListaDeCompartilhamentos from '@/components/orcamento/ListaDeCompartilhamentos.vue';
import { execuçãoOrçamentária as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { storeToRefs } from 'pinia';
import { Field, useForm } from 'vee-validate';
import {
  defineOptions, computed, ref, toRaw, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ inheritAttrs: false });

const alertStore = useAlertStore();
const DotaçãoStore = useDotaçãoStore();
const route = useRoute();
const router = useRouter();
const { meta_id } = route.params;
const { ano } = route.params;
const { id } = route.params;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const {
  OrcamentoRealizado,
} = storeToRefs(OrcamentosStore);
const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);

const currentEdit = ref({
  location: '',
  itens: [],
});
const dota = ref('');
const respostasof = ref({});

const d_orgao = ref('');
const d_unidade = ref('');
const d_funcao = ref('');
const d_subfuncao = ref('');
const d_programa = ref('');
const d_projetoatividade = ref('');
const d_contadespesa = ref('');
const d_fonte = ref('');

const complemento = computed(() => {
  if (currentEdit.value.dotacao_complemento) {
    const partes = currentEdit.value.dotacao_complemento.split('.');

    return {
      exercicio: partes[0],
      fonte: partes[1],
      acompanhamento: partes[2],
      origem: partes[3],
    };
  }

  return null;
});

(async () => {
  DotaçãoStore.getDotaçãoSegmentos(ano);
  if (id) {
    switch (route.meta.entidadeMãe) {
      case 'projeto':
      case 'obras':

        await OrcamentosStore.buscarOrçamentosRealizadosParaAno();
        break;

      case 'pdm':
      case 'planoSetorial':
      case 'programaDeMetas':
        await OrcamentosStore.getOrcamentoRealizadoById(meta_id, ano);
        break;

      default:
        console.trace('Módulo para busca de orçamentos não pôde ser identificado:', route.meta);
        throw new Error('Módulo para busca de orçamentos não pôde ser identificado');
    }

    currentEdit.value = OrcamentoRealizado.value[ano]?.find((x) => x.id == id);

    currentEdit.value.dotacao = await currentEdit.value.dotacao.split('.').map((x, i) => {
      if (x.indexOf('*') != -1) {
        if (i == 4) {
          return '****';
        } if (i == 7) {
          return '********';
        }
      }
      return x;
    }).join('.');
    dota.value = currentEdit.value.dotacao;
    validaPartes(currentEdit.value.dotacao);
    // mantendo comportamento legado
    // eslint-disable-next-line no-nested-ternary
    currentEdit.value.location = currentEdit.value.atividade?.id
      ? `a${currentEdit.value.atividade.id}`
      // eslint-disable-next-line no-nested-ternary
      : currentEdit.value.iniciativa?.id
        ? `i${currentEdit.value.iniciativa.id}`
        : currentEdit.value.meta?.id
          ? `m${currentEdit.value.meta.id}`
          : `m${meta_id}`;

    respostasof.value.projeto_atividade = currentEdit.value.projeto_atividade;

    respostasof.value.empenho_liquido = toFloat(currentEdit.value.empenho_liquido);
    respostasof.value.valor_liquidado = toFloat(currentEdit.value.valor_liquidado);

    respostasof.value.smae_soma_valor_empenho = toFloat(currentEdit.value.smae_soma_valor_empenho)
      - toFloat(currentEdit.value.soma_valor_empenho);
    respostasof.value.smae_soma_valor_liquidado = toFloat(currentEdit.value.smae_soma_valor_liquidado)
      - toFloat(currentEdit.value.soma_valor_liquidado);
  }
})();

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: currentEdit.value,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    let msg;
    let r;

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

    r = await OrcamentosStore.updateOrcamentoRealizado(id, values);
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
          path: `${parentlink}/orcamento/realizado`,
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
  return isNaN(v) || String(v).indexOf(',') !== -1
    ? Number(String(v).replace(/[^0-9\,]/g, '').replace(',', '.'))
    : Math.round(Number(v) * 100) / 100;
}
function validaPartes(a) {
  const v = a.split('.');
  if (v.length) {
    d_orgao.value = (v[0]) ? v[0] : '';
    d_unidade.value = (v[1]) ? v[1] : '';
    d_funcao.value = (v[2]) ? v[2] : '';
    d_subfuncao.value = (v[3]) ? v[3] : '';
    d_programa.value = (v[4]) ? v[4] : '';
    d_projetoatividade.value = (v[5] && v[6]) ? `${v[5]}${v[6]}` : '';
    d_contadespesa.value = (v[7]) ? v[7] : '';
    d_fonte.value = (v[8]) ? v[8] : '';
  }
}

// com `{ deep: true; }` por causa da carga atrasada da location
watch(currentEdit, (novosValores) => {
  resetForm({ values: toRaw(novosValores) });
}, { deep: true });
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
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
      <div v-if="currentEdit.processo">
        <label class="label">Processo</label>
        <input
          :value="currentEdit.processo"
          type="text"
          disabled
          class="inputtext light mb1 disabled"
        >
      </div>
      <div v-if="currentEdit.nota_empenho">
        <label class="label">Nota de empenho</label>
        <input
          :value="currentEdit.nota_empenho"
          type="text"
          disabled
          class="inputtext light mb1 disabled"
        >
      </div>
      <div>
        <label class="label">Dotação</label>
        <input
          v-model="dota"
          type="text"
          disabled
          class="inputtext light mb1 disabled"
        >
      </div>
      <template v-if="DotaçãoSegmentos[ano]?.atualizado_em">
        <label class="label mb1">Dotação orcamentária - por segmento</label>
        <div class="flex g2 mb2">
          <div class="f1">
            <label class="label tc300">Órgão</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="(it = DotaçãoSegmentos[ano].orgaos.find(x => x.codigo == d_orgao))
                ? `${it.codigo} - ${it.descricao}`
                : ''"
              disabled
            >
            <div
              v-if="d_orgao"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].orgaos.find(x => x.codigo == d_orgao))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
          <div class="f1">
            <label class="label tc300">Unidade</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="(it = DotaçãoSegmentos[ano].unidades.find(x => x.codigo == d_unidade))
                ? `${it.codigo} - ${it.descricao}`
                : ''"
              disabled
            >
            <div
              v-if="d_unidade"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].unidades.find(x => x.codigo == d_unidade))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
          <div class="f1">
            <label class="label tc300">Função</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="(it = DotaçãoSegmentos[ano].funcoes.find(x => x.codigo == d_funcao))
                ? `${it.codigo} - ${it.descricao}`
                : ''"
              disabled
            >
            <div
              v-if="d_funcao"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].funcoes.find(x => x.codigo == d_funcao))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
          <div class="f1">
            <label class="label tc300">Subfunção</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="(it = DotaçãoSegmentos[ano].subfuncoes.find(x => x.codigo == d_subfuncao))
                ? `${it.codigo} - ${it.descricao}`
                : ''"
              disabled
            >
            <div
              v-if="d_subfuncao"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].subfuncoes.find(x => x.codigo == d_subfuncao))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
          <div class="f1">
            <label class="label tc300">Programa</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="(it = DotaçãoSegmentos[ano].programas.find(x => x.codigo == d_programa))
                ? `${it.codigo} - ${it.descricao}`
                : ''"
              disabled
            >
            <div
              v-if="d_programa"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].programas.find(x => x.codigo == d_programa))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
        </div>
        <!-- categorias -->
        <!-- elementos -->
        <!-- grupos -->
        <!-- modalidades -->

        <div class="flex g2 mb2">
          <div class="f1">
            <label class="label tc300">Projeto/atividade</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="(it = DotaçãoSegmentos[ano].projetos_atividades
                .find(x => x.codigo == d_projetoatividade))
                ? `${it.codigo} - ${it.descricao}`
                : ''"
              disabled
            >
            <div
              v-if="d_projetoatividade"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].projetos_atividades
                .find(x => x.codigo == d_projetoatividade))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
          <div class="f1">
            <label class="label tc300">Conta despesa</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="d_contadespesa"
              disabled
            >
          </div>
          <div class="f1">
            <label class="label tc300">Fonte</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="(it = DotaçãoSegmentos[ano].fonte_recursos.find(x => x.codigo == d_fonte))
                ? `${it.codigo} - ${it.descricao}`
                : ''"
              disabled
            >
            <div
              v-if="d_fonte"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].fonte_recursos.find(x => x.codigo == d_fonte))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
        </div>

        <div
          v-if="complemento"
          class="flex g2 mb2"
        >
          <div class="f1">
            <label class="label tc300">Exercício da Fonte de Recurso</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="complemento.exercicio"
              disabled
            >
          </div>
          <div class="f1">
            <label class="label tc300">Fonte</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="complemento.fonte"
              disabled
            >
          </div>
          <div class="f1">
            <label class="label tc300">Código de Acompanhamento da Execução Orçamentária</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="complemento.acompanhamento"
              disabled
            >
          </div>
          <div class="f05">
            <label class="label tc300">Origem do recurso</label>
            <input
              class="inputtext light mb1 disabled"
              type="text"
              :value="complemento.origem"
              disabled
            >
          </div>
        </div>
      </template>

      <ListaDeCompartilhamentos
        v-if="$route.meta.entidadeMãe === 'pdm'"
        :ano="ano"
        :id-do-item="id"
        :pdm="activePdm.id"
        :dotação="currentEdit.dotacao"
        :processo="currentEdit.processo"
        :nota-empenho="currentEdit.nota_empenho"
        class="mb1"
      />

      <table
        v-if="respostasof.projeto_atividade != undefined"
        class="tablemain mb4"
      >
        <thead>
          <tr>
            <th style="width: 25%">
              Nome do projeto/atividade
            </th>
            <th style="width: 25%">
              Empenho SOF
            </th>
            <th style="width: 25%">
              Liquidação SOF
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="w700">
              {{ respostasof.projeto_atividade }}
            </td>
            <td>
              R$ {{ dinheiro(toFloat(respostasof.empenho_liquido)) }}
            </td>
            <td>
              R$ {{ dinheiro(toFloat(respostasof.valor_liquidado)) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)">
        <label class="label">Vincular dotação<span class="tvermelho">*</span></label>

        <pre v-ScrollLockDebug>activePdm.nivel_orcamento: {{ activePdm.nivel_orcamento }}</pre>

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
              {{ activePdm.rotulo_iniciativa }}{{ ['Atividade']
                .indexOf(activePdm.nivel_orcamento) != -1
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

      <pre v-ScrollLockDebug>values.itens:{{ values.itens }}</pre>

      <ItensRealizado
        v-model="values.itens"
        :respostasof="respostasof"
        name="itens"
      />

      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting || Object.keys(errors)?.length"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
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
