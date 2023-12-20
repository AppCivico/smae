<script setup>
import CheckClose from '@/components/CheckClose.vue';
import ItensRealizado from '@/components/orcamento/ItensRealizado.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useIniciativasStore } from '@/stores/iniciativas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as Yup from 'yup';

const alertStore = useAlertStore();
const DotaçãoStore = useDotaçãoStore();
const route = useRoute();
const router = useRouter();
const ProjetoStore = useProjetosStore();
const { meta_id } = route.params;
const { ano } = route.params;
const { id } = route.params;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);

if (!route.params.projetoId) {
  MetasStore.getPdM();
  MetasStore.getChildren(meta_id);
}

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado } = storeToRefs(OrcamentosStore);
const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);
DotaçãoStore.getDotaçãoSegmentos(ano);
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

const regdota = /^(\d{2}(\.\d{2}(\.\d{2}(\.\d{3}(\.\d{4}((?:\.\d\.\d{3})(\.\d{8}(\.\d{2})?)?)?)?)?)?)?)?$/;

const schema = Yup.object().shape({
  dotacao: Yup.string().required('Preencha a dotação.').matches(regdota, 'Formato inválido'),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.ano_referencia = Number(ano);
    values.dotacao = values.dotacao.split('.').map((x) => (x.indexOf('*') != -1 ? '*' : x)).join('.');

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

    r = await OrcamentosStore.insertOrcamentoRealizado(values);
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
}

async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await OrcamentosStore.deleteOrcamentoRealizado(id, route.params.projetoId)) {
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
function maskFloat(el) {
  el.target.value = dinheiro(Number(el.target.value.replace(/[\D]/g, '')) / 100);
  el.target?._vei?.onChange(el);
}
function dinheiro(v) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(v));
}
function toFloat(v) {
  return isNaN(v) || String(v).indexOf(',') !== -1 ? Number(String(v).replace(/[^0-9\,]/g, '').replace(',', '.')) : Math.round(Number(v) * 100) / 100;
}
function maskDotacao(el) {
  // caret.value = el.target.selectionStart;
  const kC = event.keyCode;
  const f = formatDota(el.target.value);
  el.target.value = f;
  // el.target.focus();
  // el.target.setSelectionRange(pos, pos);
  validaPartes(f);
}
function formatDota(d) {
  const data = String(d).replace(/([^0-9*])/g, '').slice(0, 27);
  let s = data.slice(0, 2);
  if (data.length > 2) s += `.${data.slice(2, 4)}`;
  if (data.length > 4) s += `.${data.slice(4, 6)}`;
  if (data.length > 6) s += `.${data.slice(6, 9)}`;
  if (data.length > 9) s += `.${data.slice(9, 13)}`;
  if (data.length > 13) s += `.${data.slice(13, 14)}`;
  if (data.length > 14) s += `.${data.slice(14, 17)}`;
  if (data.length > 17) s += `.${data.slice(17, 25)}`;
  if (data.length > 25) s += `.${data.slice(25)}`;
  return s;
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
function montaDotacao(a) {
  let o = '';
  if (d_orgao.value) o += d_orgao.value;
  if (d_unidade.value) o += `.${d_unidade.value}`;
  if (d_funcao.value) o += `.${d_funcao.value}`;
  if (d_subfuncao.value) o += `.${d_subfuncao.value}`;
  if (d_programa.value) o += `.${d_programa.value}`;
  if (d_projetoatividade.value) o += `.${d_projetoatividade.value.slice(0, 1)}.${d_projetoatividade.value.slice(1, 4)}`;
  if (d_contadespesa.value) o += `.${d_contadespesa.value}`;
  if (d_fonte.value) o += `.${d_fonte.value}`;
  dota.value = o;
}
async function validarDota() {
  try {
    respostasof.value = { loading: true };
    const val = await schema.validate({ dotacao: dota.value, valor_empenho: 1, valor_liquidado: 1 });
    if (val) {
      const params = route.params.projetoId
        ? { portfolio_id: ProjetoStore.emFoco.portfolio_id }
        : { pdm_id: activePdm.value.id };
      const r = await DotaçãoStore
        .getDotaçãoRealizado(dota.value, ano, params);
      respostasof.value = r;
    }
  } catch (error) {
    respostasof.value = error;
  }
}

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
    <Form
      v-slot="{ errors, isSubmitting, values }"
      :validation-schema="schema"
      :initial-values="currentEdit"
      @submit="onSubmit"
    >
      <div class="flex center g2">
        <div class="f1">
          <label class="label">Dotação <span class="tvermelho">*</span></label>
          <Field
            v-model="dota"
            name="dotacao"
            type="text"
            class="inputtext light mb1"
            :class="{
              error: errors.dotacao || respostasof.informacao_valida === false,
              loading: respostasof.loading
            }"
            @keyup="maskDotacao"
          />
          <div class="error-msg">
            {{ errors.dotacao }}
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
      </div>
      <template v-if="DotaçãoSegmentos[ano]?.atualizado_em">
        <label class="label mb1">Dotação orcamentária - por segmento</label>
        <div class="flex g2 mb2">
          <div class="f1">
            <label class="label tc300">Órgão <span class="tvermelho">*</span></label>
            <Field
              v-model="d_orgao"
              name="d_orgao"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              <option
                v-for="i in DotaçãoSegmentos[ano].orgaos"
                :key="i.codigo"
                :value="i.codigo"
              >
                {{ i.codigo + ' - ' + i.descricao }}
              </option>
            </Field>
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
            <label class="label tc300">Unidade <span class="tvermelho">*</span></label>
            <Field
              v-model="d_unidade"
              name="d_unidade"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              {{ (orgs = DotaçãoSegmentos[ano].unidades.filter(x => x.cod_orgao == d_orgao))
                ? ''
                : '' }}
              <option
                v-if="!orgs.length"
                value="00"
              >
                00 - Nenhum encontrado
              </option>
              <option
                v-for="i in orgs"
                :key="i.codigo"
                :value="i.codigo"
              >
                {{ i.codigo + ' - ' + i.descricao }}
              </option>
            </Field>
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
            <label class="label tc300">Função <span class="tvermelho">*</span></label>
            <Field
              v-model="d_funcao"
              name="d_funcao"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              <option
                v-for="i in DotaçãoSegmentos[ano].funcoes"
                :key="i.codigo"
                :value="i.codigo"
              >
                {{ i.codigo + ' - ' + i.descricao }}
              </option>
            </Field>
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
            <label class="label tc300">Subfunção <span class="tvermelho">*</span></label>
            <Field
              v-model="d_subfuncao"
              name="d_subfuncao"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              <option
                v-for="i in DotaçãoSegmentos[ano].subfuncoes"
                :key="i.codigo"
                :value="i.codigo"
              >
                {{ i.codigo + ' - ' + i.descricao }}
              </option>
            </Field>
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
            <label class="label tc300">Programa <span class="tvermelho">*</span></label>
            <Field
              v-model="d_programa"
              name="d_programa"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              <option
                v-for="i in DotaçãoSegmentos[ano].programas"
                :key="i.codigo"
                :value="i.codigo"
              >
                {{ i.codigo + ' - ' + i.descricao }}
              </option>
            </Field>
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
            <label class="label tc300">Projeto/atividade <span class="tvermelho">*</span></label>
            <Field
              v-model="d_projetoatividade"
              name="d_projetoatividade"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              <option
                v-for="i in DotaçãoSegmentos[ano].projetos_atividades"
                :key="i.codigo"
                :value="i.codigo"
              >
                {{ i.codigo + ' - ' + i.descricao }}
              </option>
            </Field>
            <div
              v-if="d_projetoatividade"
              class="t12 tc500"
            >
              {{ (it = DotaçãoSegmentos[ano].projetos_atividades.find(x => x.codigo == d_projetoatividade))
                ? `${it.codigo} - ${it.descricao}`
                : '' }}
            </div>
          </div>
          <div class="f1">
            <label class="label tc300">Conta despesa <span class="tvermelho">*</span></label>
            <Field
              v-model="d_contadespesa"
              name="d_contadespesa"
              type="text"
              class="inputtext light mb1"
              @input="montaDotacao"
            />
          </div>
          <div class="f1">
            <label class="label tc300">Fonte <span class="tvermelho">*</span></label>
            <Field
              v-model="d_fonte"
              name="d_fonte"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              <option
                v-for="i in DotaçãoSegmentos[ano].fonte_recursos"
                :key="i.codigo"
                :value="i.codigo"
              >
                {{ i.codigo + ' - ' + i.descricao }}
              </option>
            </Field>
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
      </template>

      <div class="tc mb2">
        <a
          class="btn outline bgnone tcprimary"
          @click="validarDota()"
        >Validar via SOF</a>
      </div>

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
            <td>R$ {{ dinheiro(toFloat(respostasof.empenho_liquido)) }}</td>
            <td>R$ {{ dinheiro(toFloat(respostasof.valor_liquidado)) }}</td>
          </tr>
        </tbody>
      </table>

      <Field
        v-if="$route.params.projetoId"
        name="projeto_id"
        type="hidden"
        :value="$route.params.projetoId"
      />
      <div v-else>
        <hr class="mt2 mb2">
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
        :controlador="values.itens"
        :respostasof="respostasof"
        name="itens"
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
</template>
