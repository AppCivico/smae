<script setup>
import { Dashboard } from '@/components';
import { default as ItensRealizado } from '@/components/orcamento/ItensRealizado.vue';
import { router } from '@/router';
import { useAlertStore, useAtividadesStore, useIniciativasStore, useMetasStore, useOrcamentosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';

const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const ano = route.params.ano;
const id = route.params.id;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);
MetasStore.getPdM();
MetasStore.getChildren(meta_id);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const parentlink = `${meta_id ? '/metas/' + meta_id : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado, DotacaoSegmentos } = storeToRefs(OrcamentosStore);
OrcamentosStore.getDotacaoSegmentos(ano);
const currentEdit = ref({});
const dota = ref('');
const dotaAno = ref(ano);
const respostasof = ref({});

const itens = ref([{ mes: null, valor_empenho: null, valor_liquidado: null }]);

var regdota = /^\d{1,5}$/;
const schema = Yup.object().shape({
  nota_empenho: Yup.string().required('Preencha o nota_empenho.').matches(regdota, 'Formato inválido'),
  dotacao: Yup.string(),
  processo: Yup.string()
});

async function onSubmit(values = {}) {
  if (respostasof.value.nota_empenho !== values.nota_empenho) {
    validarDota();
    return;
  }
  try {
    var msg;
    var r;

    values.ano_referencia = Number(ano);

    values.atividade_id = null;
    values.iniciativa_id = null;
    values.meta_id = null;

    if (values.location[0] == "a") {
      values.atividade_id = Number(values.location.slice(1));
    } else if (values.location[0] == "i") {
      values.iniciativa_id = Number(values.location.slice(1));
    } else if (values.location[0] == "m") {
      values.meta_id = Number(values.location.slice(1));
    }

    values.itens = itens.value.map(x => {
      x.valor_empenho = toFloat(x.valor_empenho);
      x.valor_liquidado = toFloat(x.valor_liquidado);
      return { mes: x.mes, valor_empenho: x.valor_empenho, valor_liquidado: x.valor_liquidado };
    });

    // sobrescrever propriedade `nota_empenho`
    r = await OrcamentosStore.insertOrcamentoRealizado({ ...values, nota_empenho: `${values.nota_empenho}/${dotaAno.value}` });
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
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await OrcamentosStore.deleteOrcamentoRealizado(id)) router.push(`${parentlink}/orcamento`) }, 'Remover');
}
function maskFloat(el) {
  el.target.value = dinheiro(Number(el.target.value.replace(/[\D]/g, '')) / 100);
  el.target?._vei?.onChange(el);
}
function dinheiro(v) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(v))
}
function toFloat(v) {
  return isNaN(v) || String(v).indexOf(',') !== -1 ? Number(String(v).replace(/[^0-9\,]/g, '').replace(',', '.')) : Math.round(Number(v) * 100) / 100;
}
function maskNota(el) {
  el.target.value = formatNota(el.target.value);
}
function formatNota(d) {
  var data = String(d).replace(/[\D]/g, '').slice(0, 5);
        var s = data.slice(0,5);
  return s;
}
async function validarDota(e) {
  dota.value = String(dota.value).padStart(5, '0');

  try {
    respostasof.value = { loading: true }
    let val = await schema.validate({ nota_empenho: dota.value, valor_empenho: 1, valor_liquidado: 1 });
    if (val) {
      let r = await OrcamentosStore.getDotacaoRealizadoNota(`${dota.value}/${dotaAno.value}`, dotaAno.value);
      respostasof.value = r;
    }
  } catch (error) {
    respostasof.value = error;
  }

  e.stopPropagation();
}
</script>
<template>
  <Dashboard>
      <div class="flex spacebetween center">
          <h1>Empenho/Liquidação</h1>
          <hr class="ml2 f1"/>
          <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
      </div>
        <h3 class="mb2"><strong>{{ano}}</strong> - {{parent_item.codigo}} - {{parent_item.titulo}}</h3>
      <template v-if="!(OrcamentoRealizado[ano]?.loading || OrcamentoRealizado[ano]?.error)">
          <Form @submit="onSubmit" :validation-schema="schema" :initial-values="currentEdit" v-slot="{ errors, isSubmitting, values }">
              <div class="flex center g2">
                  <div class="f1">
                      <label class="label">Nota de empenho <span class="tvermelho">*</span></label>
                      <Field name="nota_empenho" v-model="dota" type="text" class="inputtext light mb1" @keyup="maskNota" @keyup.enter="validarDota()" :class="{ 'error': errors.nota_empenho||respostasof.informacao_valida===false, 'loading': respostasof.loading}" />
                      <div class="error-msg">{{ errors.nota_empenho }}</div>
                      <div class="t13 mb1 tc300" v-if="respostasof.loading">Aguardando resposta do SOF</div>
                      <div class="t13 mb1 tvermelho" v-if="respostasof.informacao_valida===false">Dotação não encontrada</div>
                  </div>

                  <div class="f1">
                      <label class="label">Ano da nota de empenho <span
                      class="tvermelho">*</span></label>

                      <Field name="nota_ano" v-model="dotaAno" type="number" list="foobar"
                      min="2003" :max="ano" class="inputtext light mb1" @keyup.enter="validarDota()" :class="{ 'error':
                      errors.nota_ano||respostasof.informacao_valida===false,
                      'loading': respostasof.loading}" />
                      <div class="error-msg">{{ errors.nota_ano }}</div>
                      <div class="t13 mb1 tc300" v-if="respostasof.loading">Aguardando resposta do SOF</div>
                      <div class="t13 mb1 tvermelho" v-if="respostasof.informacao_valida===false">Dotação não encontrada</div>
                  </div>
                  <div class="f0">
                    <a @click="validarDota()" class="btn outline bgnone tcprimary">Validar via SOF</a>
                  </div>
              </div>

              <template v-if="respostasof.dotacao!=undefined">
                <Field name="dotacao" type="hidden" :value="respostasof.dotacao" class="inputcheckbox"/>
                <Field name="processo" type="hidden" :value="respostasof.processo" class="inputcheckbox"/>
                <table class="tablemain fix mb4">
                    <thead>
                        <tr>
                            <th style="width: 20%">Dotação</th>
                            <th style="width: 20%">Processo</th>
                            <th style="width: 50%">Nome do projeto/atividade</th>
                            <th style="width: 120px">Empenho SOF</th>
                            <th style="width: 120px">Liquidação SOF</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{{respostasof.dotacao}}</td>
                            <td>{{respostasof.processo}}</td>
                            <td class="w700">{{respostasof.projeto_atividade}}</td>
                            <td>R$ {{dinheiro(toFloat(respostasof.empenho_liquido))}}</td>
                            <td>R$ {{dinheiro(toFloat(respostasof.valor_liquidado))}}</td>
                        </tr>
                    </tbody>
                </table>
              </template>

              <template v-if="respostasof.dotacao">
                <div>
                        <label class="label">Vincular dotação<span class="tvermelho">*</span></label>

                        <div v-for="m in singleMeta.children" :key="m.id">
                          <div class="label tc300">Meta</div>
                          <label class="block mb1">
                            <Field name="location" type="radio" :value="'m'+m.id" class="inputcheckbox"/>
                            <span>{{m.codigo}} - {{m.titulo}}</span>
                          </label>
                          <template v-if="['Iniciativa','Atividade'].indexOf(activePdm.nivel_orcamento)!=-1">
                            <div v-if="m?.iniciativas?.length" class="label tc300">{{activePdm.rotulo_iniciativa}}{{ ['Atividade'].indexOf(activePdm.nivel_orcamento)!=-1 ? ' e '+activePdm.rotulo_atividade:'' }}</div>
                            <div v-for="i in m.iniciativas" :key="i.id" class="">
                              <label class="block mb1">
                                <Field name="location" type="radio" :value="'i'+i.id" class="inputcheckbox"/>
                                <span>{{i.codigo}} - {{i.titulo}}</span>
                              </label>
                              <template v-if="activePdm.nivel_orcamento=='Atividade'">
                                <div v-for="a in i.atividades" :key="a.id" class="pl2">
                                  <label class="block mb1">
                                    <Field name="location" type="radio" :value="'a'+a.id" class="inputcheckbox"/>
                                    <span>{{a.codigo}} - {{a.titulo}}</span>
                                  </label>
                                </div>
                              </template>
                            </div>
                          </template>
                        </div>
                        <div class="error-msg">{{ errors.location }}</div>
                  </div>

                <ItensRealizado :controlador="itens" :respostasof="respostasof" />

                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
              </template>
          </Form>
      </template>
      <template v-if="currentEdit&&currentEdit?.id">
          <button @click="checkDelete(currentEdit.id)" class="btn amarelo big">Remover item</button>
      </template>
      <template v-if="OrcamentoRealizado[ano]?.loading">
          <span class="spinner">Carregando</span>
      </template>
      <template v-if="OrcamentoRealizado[ano]?.error||error">
          <div class="error p1">
              <div class="error-msg">{{OrcamentoRealizado[ano].error??error}}</div>
          </div>
      </template>
  </Dashboard>
</template>
