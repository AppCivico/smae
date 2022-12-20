<script setup>
import { ref } from 'vue';
import { Dashboard } from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { storeToRefs } from 'pinia';
import { router } from '@/router';
import { useRoute } from 'vue-router';
import { useAlertStore, useOrcamentosStore, useMetasStore, useIniciativasStore, useAtividadesStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const ano = route.params.ano;
const id = route.params.id;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);
MetasStore.getPdM();
MetasStore.getChildren(meta_id);

const parentlink = `${meta_id ? '/metas/' + meta_id : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const { OrcamentoPlanejado, DotacaoSegmentos } = storeToRefs(OrcamentosStore);
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

(async () => {
  await OrcamentosStore.getDotacaoSegmentos(ano);
  if (id) {
    await OrcamentosStore.getOrcamentoPlanejadoById(meta_id, ano);
    currentEdit.value = OrcamentoPlanejado.value[ano].find(x => x.id == id);
    currentEdit.value.valor_planejado = dinheiro(currentEdit.value.valor_planejado);

    currentEdit.value.dotacao = await currentEdit.value.dotacao.split('.').map((x, i) => {
      if (x.indexOf('*') != -1) {
        if (i == 4) {
          return "****";
        } else if (i == 7) {
          return "********";
        }
      }
      return x;
    }).join('.');
    dota.value = currentEdit.value.dotacao;
    validaPartes(currentEdit.value.dotacao);

    currentEdit.value.location =
      currentEdit.value.atividade?.id ? 'a' + currentEdit.value.atividade.id :
        currentEdit.value.iniciativa?.id ? 'i' + currentEdit.value.iniciativa.id :
          currentEdit.value.meta?.id ? 'm' + currentEdit.value.meta.id : 'm' + meta_id;

    respostasof.value.projeto_atividade = currentEdit.value.projeto_atividade;
    respostasof.value.saldo_disponivel = currentEdit.value.saldo_disponivel;
    respostasof.value.smae_soma_valor_planejado = toFloat(currentEdit.value.smae_soma_valor_planejado) - toFloat(currentEdit.value.valor_planejado);
    respostasof.value.val_orcado_atualizado = currentEdit.value.val_orcado_atualizado;
    respostasof.value.val_orcado_inicial = currentEdit.value.val_orcado_inicial;
  }
})();

var regdota = /^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/;
const schema = Yup.object().shape({
  valor_planejado: Yup.string().required('Preencha o valor planejado.'),
  dotacao: Yup.string().required('Preencha a dotação.').matches(regdota, 'Formato inválido')
});

async function onSubmit(values) {
  try {
    var msg;
    var r;

    values.meta_id = meta_id;
    values.ano_referencia = Number(ano);
    if (isNaN(values.valor_planejado)) values.valor_planejado = toFloat(values.valor_planejado);

    values.dotacao = values.dotacao.split('.').map(x => x.indexOf('*') != -1 ? '*' : x).join('.');

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

    if (id) {
      r = await OrcamentosStore.updateOrcamentoPlanejado(id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await OrcamentosStore.insertOrcamentoPlanejado(values);
      msg = 'Dados salvos com sucesso!';
    }

    if (r == true) {
      alertStore.success(msg);
      await router.push(`${parentlink}/orcamento/planejado`);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', `${parentlink}/orcamento/planejado`);
}

async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await OrcamentosStore.deleteOrcamentoPlanejado(id)) router.push(`${parentlink}/orcamento`) }, 'Remover');
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
function maskDotacao(el) {
  //caret.value = el.target.selectionStart;
  var kC = event.keyCode;
  let f = formatDota(el.target.value);
  el.target.value = f;
  //el.target.focus();
  //el.target.setSelectionRange(pos, pos);
  validaPartes(f);
}
function formatDota(d) {
  var data = String(d).replace(/([^0-9*])/g, '').slice(0, 27);
  var s = data.slice(0, 2);
  if (data.length > 2) s += '.' + data.slice(2, 4);
  if (data.length > 4) s += '.' + data.slice(4, 6);
  if (data.length > 6) s += '.' + data.slice(6, 9);
  if (data.length > 9) s += '.' + data.slice(9, 13);
  if (data.length > 13) s += '.' + data.slice(13, 14);
  if (data.length > 14) s += '.' + data.slice(14, 17);
  if (data.length > 17) s += '.' + data.slice(17, 25);
  if (data.length > 25) s += '.' + data.slice(25);
  return s;
}
function validaPartes(a) {
  let v = a.split('.');
  if (v.length) {
    d_orgao.value = (v[0]) ? v[0] : '';
    d_unidade.value = (v[1]) ? v[1] : '';
    d_funcao.value = (v[2]) ? v[2] : '';
    d_subfuncao.value = (v[3]) ? v[3] : '';
    d_programa.value = (v[4]) ? v[4] : '';
    d_projetoatividade.value = (v[5] && v[6]) ? v[5] + '' + v[6] : '';
    d_contadespesa.value = (v[7]) ? v[7] : '';
    d_fonte.value = (v[8]) ? v[8] : '';
  }
}
function montaDotacao(a) {
  let o = '';
  if (d_orgao.value) o += d_orgao.value;
  if (d_unidade.value) o += '.' + d_unidade.value;
  if (d_funcao.value) o += '.' + d_funcao.value;
  if (d_subfuncao.value) o += '.' + d_subfuncao.value;
  if (d_programa.value) o += '.' + d_programa.value;
  if (d_projetoatividade.value) o += '.' + d_projetoatividade.value.slice(0, 1) + '.' + d_projetoatividade.value.slice(1, 4);
  if (d_contadespesa.value) o += '.' + d_contadespesa.value;
  if (d_fonte.value) o += '.' + d_fonte.value;
  dota.value = o;
}
async function validarDota() {
  try {
    respostasof.value = { loading: true }
    let val = await schema.validate({ dotacao: dota.value, valor_planejado: 1 });
    if (val) {
      let r = await OrcamentosStore.getDotacaoPlanejado(dota.value, ano);
      respostasof.value = r;
      if (id) {
        respostasof.value.smae_soma_valor_planejado -= toFloat(currentEdit.value.valor_planejado);
      }
    }
  } catch (error) {
    respostasof.value = error;
  }
}
</script>
<template>
  <Dashboard>
      <div class="flex spacebetween center">
          <h1>Adicionar dotação</h1>
          <hr class="ml2 f1"/>
          <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
      </div>
        <h3 class="mb2"><strong>{{ ano }}</strong> - {{ parent_item.codigo }} - {{ parent_item.titulo }}</h3>
      <template v-if="!(OrcamentoPlanejado[ano]?.loading || OrcamentoPlanejado[ano]?.error)">
          <Form @submit="onSubmit" :validation-schema="schema" :initial-values="currentEdit" v-slot="{ errors, isSubmitting, values }">
              <div class="flex center g2">
                  <div class="f1">
                      <label class="label">Dotação <span class="tvermelho">*</span></label>
                      <Field name="dotacao" v-model="dota" type="text" class="inputtext light mb1" @keyup="maskDotacao" :class="{ 'error': errors.dotacao || respostasof.informacao_valida === false, 'loading': respostasof.loading }" />
                      <div class="error-msg">{{ errors.dotacao }}</div>
                      <div class="t13 mb1 tc300" v-if="respostasof.loading">Aguardando resposta do SOF</div>
                      <div class="t13 mb1 tvermelho" v-if="respostasof.informacao_valida === false">Dotação não encontrada</div>
                  </div>
              </div>
              <template v-if="DotacaoSegmentos[ano]?.atualizado_em">
                  <label class="label mb1">parte da dotação - por segmento</label>
                <div class="flex g2 mb2">
                    <div class="f1">
                      <label class="label tc300">Órgão <span class="tvermelho">*</span></label>
                        <Field name="d_orgao" v-model="d_orgao" @change="montaDotacao" as="select" class="inputtext light mb1">
                          <option v-for="i in DotacaoSegmentos[ano].orgaos" :key="i.codigo" :value="i.codigo">{{ i.codigo + ' - ' + i.descricao }}</option>
                        </Field>
                        <div class="t12 tc500" v-if="d_orgao">
                          {{ (it = DotacaoSegmentos[ano].orgaos.find(x => x.codigo == d_orgao)) ? `${it.codigo} - ${it.descricao}` : '' }}
                        </div>
                    </div>
                    <div class="f1">
                        <label class="label tc300">Unidade <span class="tvermelho">*</span></label>
                        <Field name="d_unidade" v-model="d_unidade" @change="montaDotacao" as="select" class="inputtext light mb1">
                          <option v-for="i in DotacaoSegmentos[ano].unidades" :key="i.codigo" :value="i.codigo">{{ i.codigo + ' - ' + i.descricao }}</option>
                        </Field>
                        <div class="t12 tc500" v-if="d_unidade">
                          {{ (it = DotacaoSegmentos[ano].unidades.find(x => x.codigo == d_unidade)) ? `${it.codigo} - ${it.descricao}` : '' }}
                        </div>
                    </div>
                    <div class="f1">
                        <label class="label tc300">Função <span class="tvermelho">*</span></label>
                        <Field name="d_funcao" v-model="d_funcao" @change="montaDotacao" as="select" class="inputtext light mb1">
                          <option v-for="i in DotacaoSegmentos[ano].funcoes" :key="i.codigo" :value="i.codigo">{{ i.codigo + ' - ' + i.descricao }}</option>
                        </Field>
                        <div class="t12 tc500" v-if="d_funcao">
                          {{ (it = DotacaoSegmentos[ano].funcoes.find(x => x.codigo == d_funcao)) ? `${it.codigo} - ${it.descricao}` : '' }}
                        </div>
                    </div>
                    <div class="f1">
                        <label class="label tc300">Subfunção <span class="tvermelho">*</span></label>
                        <Field name="d_subfuncao" v-model="d_subfuncao" @change="montaDotacao" as="select" class="inputtext light mb1">
                          <option v-for="i in DotacaoSegmentos[ano].subfuncoes" :key="i.codigo" :value="i.codigo">{{ i.codigo + ' - ' + i.descricao }}</option>
                        </Field>
                        <div class="t12 tc500" v-if="d_subfuncao">
                          {{ (it = DotacaoSegmentos[ano].subfuncoes.find(x => x.codigo == d_subfuncao)) ? `${it.codigo} - ${it.descricao}` : '' }}
                        </div>
                    </div>
                    <div class="f1">
                        <label class="label tc300">Programa <span class="tvermelho">*</span></label>
                        <Field name="d_programa" v-model="d_programa" @change="montaDotacao" as="select" class="inputtext light mb1">
                          <option v-for="i in DotacaoSegmentos[ano].programas" :key="i.codigo" :value="i.codigo">{{ i.codigo + ' - ' + i.descricao }}</option>
                        </Field>
                        <div class="t12 tc500" v-if="d_programa">
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
                        <label class="label tc300">Projeto/atividade <span class="tvermelho">*</span></label>
                        <Field name="d_projetoatividade" v-model="d_projetoatividade" @change="montaDotacao" as="select" class="inputtext light mb1">
                          <option v-for="i in DotacaoSegmentos[ano].projetos_atividades" :key="i.codigo" :value="i.codigo">{{ i.codigo + ' - ' + i.descricao }}</option>
                        </Field>
                        <div class="t12 tc500" v-if="d_projetoatividade">
                          {{ (it = DotacaoSegmentos[ano].projetos_atividades.find(x => x.codigo == d_projetoatividade)) ? `${it.codigo} - ${it.descricao}` : '' }}
                        </div>
                    </div>
                    <div class="f1">
                        <label class="label tc300">Conta despesa <span class="tvermelho">*</span></label>
                        <Field name="d_contadespesa" v-model="d_contadespesa" @input="montaDotacao" type="text" class="inputtext light mb1">
                        </Field>
                    </div>
                    <div class="f1">
                        <label class="label tc300">Fonte <span class="tvermelho">*</span></label>
                        <Field name="d_fonte" v-model="d_fonte" @change="montaDotacao" as="select" class="inputtext light mb1">
                          <option v-for="i in DotacaoSegmentos[ano].fonte_recursos" :key="i.codigo" :value="i.codigo">{{ i.codigo + ' - ' + i.descricao }}</option>
                        </Field>
                        <div class="t12 tc500" v-if="d_fonte">
                          {{ (it = DotacaoSegmentos[ano].fonte_recursos.find(x => x.codigo == d_fonte)) ? `${it.codigo} - ${it.descricao}` : '' }}
                        </div>
                    </div>
                </div>
              </template>

              <div class="tc mb2">
                <a @click="validarDota()" class="btn outline bgnone tcprimary">Validar via SOF</a>
              </div>


              <table class="tablemain mb2" v-if="respostasof.smae_soma_valor_planejado != undefined">
                  <thead>
                      <tr>
                          <th style="width: 25%">Nome do projeto/atividade</th>
                          <th style="width: 25%">Orçado inicial</th>
                          <th style="width: 25%">Orçado Atualizado</th>
                          <th style="width: 25%">Saldo disponível</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                        <td class="w700">{{ respostasof.projeto_atividade }}</td>
                          <td>R$ {{ dinheiro(toFloat(respostasof.val_orcado_inicial)) }}</td>
                          <td>R$ {{ dinheiro(toFloat(respostasof.val_orcado_atualizado)) }}</td>
                          <td>R$ {{ dinheiro(toFloat(respostasof.saldo_disponivel)) }}</td>
                      </tr>
                  </tbody>
              </table>


              <div>
                    <label class="label">Vincular dotação<span class="tvermelho">*</span></label>

                    <div v-for="m in singleMeta.children" :key="m.id">
                      <div class="label tc300">Meta</div>
                      <label class="block mb1">
                        <Field name="location" type="radio" :value="'m' + m.id" class="inputcheckbox"/>
                        <span>{{ m.codigo }} - {{ m.titulo }}</span>
                      </label>
                      <template v-if="['Iniciativa', 'Atividade'].indexOf(activePdm.nivel_orcamento) != -1">
                        <div v-if="m?.iniciativas?.length" class="label tc300">{{ activePdm.rotulo_iniciativa }}{{ ['Atividade'].indexOf(activePdm.nivel_orcamento) != -1 ? ' e ' + activePdm.rotulo_atividade : '' }}</div>
                        <div v-for="i in m.iniciativas" :key="i.id" class="">
                          <label class="block mb1">
                            <Field name="location" type="radio" :value="'i' + i.id" class="inputcheckbox"/>
                            <span>{{ i.codigo }} - {{ i.titulo }}</span>
                          </label>
                          <template v-if="activePdm.nivel_orcamento == 'Atividade'">
                            <div v-for="a in i.atividades" :key="a.id" class="pl2">
                              <label class="block mb1">
                                <Field name="location" type="radio" :value="'a' + a.id" class="inputcheckbox"/>
                                <span>{{ a.codigo }} - {{ a.titulo }}</span>
                              </label>
                            </div>
                          </template>
                        </div>
                      </template>
                    </div>
                    <div class="error-msg">{{ errors.location }}</div>
              </div>
              <div class="flex g2 mb2">
                  <div class="f1">
                      <label class="label">Valor planejado<span class="tvermelho">*</span></label>
                      <Field name="valor_planejado" @keyup="maskFloat" type="text" class="inputtext light mb1" :class="{ 'error': errors.valor_planejado }" />
                      <div class="error-msg">{{ errors.valor_planejado }}</div>
                      <div class="flex center" v-if="respostasof.smae_soma_valor_planejado != undefined">
                        <span class="label mb0 tc300 mr1">Total planejado no SMAE</span>
                        {{ (somatotal = toFloat(respostasof.smae_soma_valor_planejado) + toFloat(values.valor_planejado)) ? '' : '' }}
                        <span class="t14">R$ {{ dinheiro(somatotal) }}</span>
                        <span v-if="somatotal > toFloat(respostasof.val_orcado_atualizado)" class="tvermelho w700">(Pressão orçamentária)</span>
                      </div>
                  </div>
              </div>

              <div class="flex spacebetween center mb2">
                  <hr class="mr2 f1"/>
                  <button class="btn big" :disabled="isSubmitting">Salvar</button>
                  <hr class="ml2 f1"/>
              </div>
          </Form>
      </template>
      <template v-if="currentEdit && currentEdit?.id">
          <button @click="checkDelete(currentEdit.id)" class="btn amarelo big">Remover item</button>
      </template>
      <template v-if="OrcamentoPlanejado[ano]?.loading">
          <span class="spinner">Carregando</span>
      </template>
      <template v-if="OrcamentoPlanejado[ano]?.error || error">
          <div class="error p1">
              <div class="error-msg">{{ OrcamentoPlanejado[ano].error ?? error }}</div>
          </div>
      </template>
  </Dashboard>
</template>
