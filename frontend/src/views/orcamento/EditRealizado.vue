<script setup>
import { Dashboard } from '@/components';
import { default as ItensRealizado } from '@/components/orcamento/ItensRealizado.vue';
import { router } from '@/router';
import {
  useAlertStore, useAtividadesStore, useIniciativasStore, useMetasStore, useOrcamentosStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();
const route = useRoute();
const { meta_id } = route.params;
const { ano } = route.params;
const { id } = route.params;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);
MetasStore.getPdM();
MetasStore.getChildren(meta_id);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const {
  OrcamentoRealizado, DotacaoSegmentos, totaisQueSuperamSOF, maioresDosItens,
} = storeToRefs(OrcamentosStore);

const currentEdit = ref({});
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

const itens = ref([]);

(async () => {
  await OrcamentosStore.getDotacaoSegmentos(ano);
  if (id) {
    await OrcamentosStore.getOrcamentoRealizadoById(meta_id, ano);
    currentEdit.value = OrcamentoRealizado.value[ano].find((x) => x.id == id);

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

    currentEdit.value.location = currentEdit.value.atividade?.id ? `a${currentEdit.value.atividade.id}`
      : currentEdit.value.iniciativa?.id ? `i${currentEdit.value.iniciativa.id}`
        : currentEdit.value.meta?.id ? `m${currentEdit.value.meta.id}` : `m${meta_id}`;

    respostasof.value.projeto_atividade = currentEdit.value.projeto_atividade;

    respostasof.value.empenho_liquido = toFloat(currentEdit.value.empenho_liquido);
    respostasof.value.valor_liquidado = toFloat(currentEdit.value.valor_liquidado);

    respostasof.value.smae_soma_valor_empenho = toFloat(currentEdit.value.smae_soma_valor_empenho) - toFloat(currentEdit.value.soma_valor_empenho);
    respostasof.value.smae_soma_valor_liquidado = toFloat(currentEdit.value.smae_soma_valor_liquidado) - toFloat(currentEdit.value.soma_valor_liquidado);

    itens.value = currentEdit.value.itens;
  }
})();

function beforeSubmit(values) {
  if (totaisQueSuperamSOF.value.some((x) => ['empenho', 'liquidacao'].includes(x))) {
    useAlertStore().confirmAction('Valores superioes ao SOF', async () => {
      try {
        onSubmit(values);
      } catch (error) {
        return false;
      }
    }, 'Deseja mesmo salvar?');
  } else {
    onSubmit(values);
  }
}

async function onSubmit(values) {
  try {
    let msg;
    let r;

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
    values.itens = itens.value.map((x) => {
      x.valor_empenho = toFloat(x.valor_empenho);
      x.valor_liquidado = toFloat(x.valor_liquidado);
      return { mes: x.mes, valor_empenho: x.valor_empenho, valor_liquidado: x.valor_liquidado };
    });

    r = await OrcamentosStore.updateOrcamentoRealizado(id, values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      alertStore.success(msg);
      await router.push(`${parentlink}/orcamento/realizado`);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', `${parentlink}/orcamento/realizado`);
}

async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await OrcamentosStore.deleteOrcamentoRealizado(id)) router.push(`${parentlink}/orcamento/realizado`); }, 'Remover');
}

function dinheiro(v) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(v));
}
function toFloat(v) {
  return isNaN(v) || String(v).indexOf(',') !== -1 ? Number(String(v).replace(/[^0-9\,]/g, '').replace(',', '.')) : Math.round(Number(v) * 100) / 100;
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

</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center">
      <h1>Empenho/Liquidação</h1>
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
    <h3 class="mb2">
      <strong>{{ ano }}</strong> - {{ parent_item.codigo }} - {{ parent_item.titulo }}
    </h3>
    <template v-if="!(OrcamentoRealizado[ano]?.loading || OrcamentoRealizado[ano]?.error)">
      <Form
        v-slot="{ errors, isSubmitting, values }"
        :initial-values="currentEdit"
        @submit="onSubmit"
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
        <template v-if="DotacaoSegmentos[ano]?.atualizado_em">
          <label class="label mb1">parte da dotação - por segmento</label>
          <div class="flex g2 mb2">
            <div class="f1">
              <label class="label tc300">Órgão</label>
              <input
                class="inputtext light mb1 disabled"
                type="text"
                :value="(it = DotacaoSegmentos[ano].orgaos.find(x => x.codigo == d_orgao)) ? `${it.codigo} - ${it.descricao}` : ''"
                disabled
              >
              <div
                v-if="d_orgao"
                class="t12 tc500"
              >
                {{ (it = DotacaoSegmentos[ano].orgaos.find(x => x.codigo == d_orgao)) ? `${it.codigo} - ${it.descricao}` : '' }}
              </div>
            </div>
            <div class="f1">
              <label class="label tc300">Unidade</label>
              <input
                class="inputtext light mb1 disabled"
                type="text"
                :value="(it = DotacaoSegmentos[ano].unidades.find(x => x.codigo == d_unidade)) ? `${it.codigo} - ${it.descricao}` : ''"
                disabled
              >
              <div
                v-if="d_unidade"
                class="t12 tc500"
              >
                {{ (it = DotacaoSegmentos[ano].unidades.find(x => x.codigo == d_unidade)) ? `${it.codigo} - ${it.descricao}` : '' }}
              </div>
            </div>
            <div class="f1">
              <label class="label tc300">Função</label>
              <input
                class="inputtext light mb1 disabled"
                type="text"
                :value="(it = DotacaoSegmentos[ano].funcoes.find(x => x.codigo == d_funcao)) ? `${it.codigo} - ${it.descricao}` : ''"
                disabled
              >
              <div
                v-if="d_funcao"
                class="t12 tc500"
              >
                {{ (it = DotacaoSegmentos[ano].funcoes.find(x => x.codigo == d_funcao)) ? `${it.codigo} - ${it.descricao}` : '' }}
              </div>
            </div>
            <div class="f1">
              <label class="label tc300">Subfunção</label>
              <input
                class="inputtext light mb1 disabled"
                type="text"
                :value="(it = DotacaoSegmentos[ano].subfuncoes.find(x => x.codigo == d_subfuncao)) ? `${it.codigo} - ${it.descricao}` : ''"
                disabled
              >
              <div
                v-if="d_subfuncao"
                class="t12 tc500"
              >
                {{ (it = DotacaoSegmentos[ano].subfuncoes.find(x => x.codigo == d_subfuncao)) ? `${it.codigo} - ${it.descricao}` : '' }}
              </div>
            </div>
            <div class="f1">
              <label class="label tc300">Programa</label>
              <input
                class="inputtext light mb1 disabled"
                type="text"
                :value="(it = DotacaoSegmentos[ano].programas.find(x => x.codigo == d_programa)) ? `${it.codigo} - ${it.descricao}` : ''"
                disabled
              >
              <div
                v-if="d_programa"
                class="t12 tc500"
              >
                {{ (it = DotacaoSegmentos[ano].programas.find(x => x.codigo == d_programa)) ? `${it.codigo} - ${it.descricao}` : '' }}
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
                :value="(it = DotacaoSegmentos[ano].projetos_atividades.find(x => x.codigo == d_projetoatividade)) ? `${it.codigo} - ${it.descricao}` : ''"
                disabled
              >
              <div
                v-if="d_projetoatividade"
                class="t12 tc500"
              >
                {{ (it = DotacaoSegmentos[ano].projetos_atividades.find(x => x.codigo == d_projetoatividade)) ? `${it.codigo} - ${it.descricao}` : '' }}
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
                :value="(it = DotacaoSegmentos[ano].fonte_recursos.find(x => x.codigo == d_fonte)) ? `${it.codigo} - ${it.descricao}` : ''"
                disabled
              >
              <div
                v-if="d_fonte"
                class="t12 tc500"
              >
                {{ (it = DotacaoSegmentos[ano].fonte_recursos.find(x => x.codigo == d_fonte)) ? `${it.codigo} - ${it.descricao}` : '' }}
              </div>
            </div>
          </div>
        </template>

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

        <div>
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
                {{ activePdm.rotulo_iniciativa }}{{ ['Atividade'].indexOf(activePdm.nivel_orcamento) != -1 ? ' e ' + activePdm.rotulo_atividade : '' }}
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
          :controlador="itens"
          :respostasof="respostasof"
        />

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
    <template v-if="OrcamentoRealizado[ano]?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ OrcamentoRealizado[ano].error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
