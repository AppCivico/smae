<script setup>
import dinheiro from '@/helpers/dinheiro';
import toFloat from '@/helpers/toFloat';
import { useAlertStore } from '@/stores/alert.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { defineOptions, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as Yup from 'yup';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  parametrosParaValidacao: {
    type: Object,
    required: true,
  },
});

const DotaçãoStore = useDotaçãoStore();
const ProjetoStore = useProjetosStore();

const alertStore = useAlertStore();
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
const { OrcamentoPlanejado } = storeToRefs(OrcamentosStore);
const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);
const currentEdit = ref({});
const dota = ref('');
const respostasof = ref({});
const validando = ref(false);

const d_orgao = ref('');
const d_unidade = ref('');
const d_funcao = ref('');
const d_subfuncao = ref('');
const d_programa = ref('');
const d_projetoatividade = ref('');
const d_contadespesa = ref('');
const d_fonte = ref('');

(async () => {
  DotaçãoStore.getDotaçãoSegmentos(ano);
  if (id) {
    switch (route.meta.entidadeMãe) {
      case 'projeto':
      case 'obras':
        await OrcamentosStore.buscarOrçamentosPlanejadosParaAno();
        break;

      case 'pdm':
      case 'planoSetorial':
      case 'programaDeMetas':
        await OrcamentosStore.getOrcamentoPlanejadoById(meta_id, ano);
        break;

      default:
        console.trace('Módulo para busca de orçamentos não pôde ser identificado:', route.meta);
        throw new Error('Módulo para busca de orçamentos não pôde ser identificado');
    }

    currentEdit.value = OrcamentoPlanejado.value[ano].find((x) => x.id == id);
    currentEdit.value.valor_planejado = dinheiro(currentEdit.value.valor_planejado);

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

    currentEdit.value.location = currentEdit.value.atividade?.id
      ? `a${currentEdit.value.atividade.id}`
      : currentEdit.value.iniciativa?.id
        ? `i${currentEdit.value.iniciativa.id}`
        : currentEdit.value.meta?.id
          ? `m${currentEdit.value.meta.id}`
          : `m${meta_id}`;

    respostasof.value.projeto_atividade = currentEdit.value.projeto_atividade;
    respostasof.value.saldo_disponivel = currentEdit.value.saldo_disponivel;
    respostasof.value.smae_soma_valor_planejado = toFloat(currentEdit.value.smae_soma_valor_planejado) - toFloat(currentEdit.value.valor_planejado);
    respostasof.value.val_orcado_atualizado = currentEdit.value.val_orcado_atualizado;
    respostasof.value.val_orcado_inicial = currentEdit.value.val_orcado_inicial;
  }
})();

const regdota = /^(\d{2}(\.\d{2}(\.\d{2}(\.\d{3}(\.\d{4}((?:\.\d\.\d{3})(\.\d{8}(\.\d{2})?)?)?)?)?)?)?)?$/;

const schema = Yup.object().shape({
  valor_planejado: Yup.string().required('Preencha o valor planejado.'),
  dotacao: Yup.string().required('Preencha a dotação.').matches(regdota, 'Formato inválido'),
});

const {
  errors, handleSubmit, isSubmitting, values, validateField, setValues
} = useForm({
  initialValues: currentEdit.value,
  validationSchema: schema,
});

watch(currentEdit, (newValue) => {
  if (newValue.id) {
    setValues({
      valor_planejado: newValue.valor_planejado,
    });
  }
});

const onSubmit = handleSubmit(async () => {
  try {
    let msg;
    let r;

    values.meta_id = meta_id;
    values.ano_referencia = Number(ano);
    if (isNaN(values.valor_planejado)) values.valor_planejado = toFloat(values.valor_planejado);

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

    if (id) {
      r = await OrcamentosStore.updateOrcamentoPlanejado(id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await OrcamentosStore.insertOrcamentoPlanejado(values);
      msg = 'Dados salvos com sucesso!';
    }

    if (r == true) {
      alertStore.success(msg);
      if (route.meta?.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          query: route.query,
        });
      } else {
        await router.push({
          path: `${parentlink}/orcamento/planejado`,
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
    if (await OrcamentosStore.deleteOrcamentoPlanejado(id, route.params)) {
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

function maskDotacao(el) {
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
  validando.value = true;
  try {
    respostasof.value = { loading: true };

    const { valid } = await validateField('dotacao');
    if (valid) {
      const r = await DotaçãoStore
        .getDotaçãoPlanejado(dota.value, ano, props.parametrosParaValidacao);
      respostasof.value = r;
      if (id) {
        respostasof.value.smae_soma_valor_planejado -= toFloat(currentEdit.value.valor_planejado);
      }
    } else {
      respostasof.value = {};
    }
  } catch (error) {
    respostasof.value = error;
  } finally {
    validando.value = false;
  }
}
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center">
    <h1>Adicionar dotação</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <h3 class="mb2">
    <strong>{{ ano }}</strong> - {{ parent_item.codigo }} - {{ parent_item.titulo }}
  </h3>
  <template v-if="!(OrcamentoPlanejado[ano]?.loading || OrcamentoPlanejado[ano]?.error)">
    <form
      @submit.prevent="onSubmit"
    >
      <div class="flex center g2 mb1">
        <div class="f1">
          <label class="label">Dotação <span class="tvermelho">*</span></label>
          <Field
            v-model="dota"
            name="dotacao"
            type="text"
            class="inputtext light mb1"
            :class="{
              error: errors.dotacao || respostasof.informacao_valida === false,
            }"
            :aria-busy="validando"
            @keyup="maskDotacao"
          />
          <ErrorMessage name="dotacao" />
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

      <table
        v-if="respostasof.smae_soma_valor_planejado != undefined"
        class="tablemain mb2"
      >
        <thead>
          <tr>
            <th style="width: 25%">
              Nome do projeto/atividade
            </th>
            <th style="width: 25%">
              Orçado inicial
            </th>
            <th style="width: 25%">
              Orçado Atualizado
            </th>
            <th style="width: 25%">
              Saldo disponível
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="w700">
              {{ respostasof.projeto_atividade }}
            </td>
            <td>R$ {{ dinheiro(toFloat(respostasof.val_orcado_inicial)) }}</td>
            <td>R$ {{ dinheiro(toFloat(respostasof.val_orcado_atualizado)) }}</td>
            <td>R$ {{ dinheiro(toFloat(respostasof.saldo_disponivel)) }}</td>
          </tr>
        </tbody>
      </table>

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
      <div class="flex g2 mb2">
        <div class="f1">
          <label class="label">Valor planejado<span class="tvermelho">*</span></label>
          <Field
            name="valor_planejado"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.valor_planejado }"
            @keyup="maskFloat"
          />
          <div class="error-msg">
            {{ errors.valor_planejado }}
          </div>
          <div
            v-if="respostasof.smae_soma_valor_planejado != undefined"
            class="flex center"
          >
            <span class="label mb0 tc300 mr1">Total planejado no SMAE</span>
            {{ (somatotal = toFloat(respostasof.smae_soma_valor_planejado) + toFloat(values.valor_planejado))
              ? ''
              : '' }}
            <span class="t14">R$ {{ dinheiro(somatotal) }}</span>
            <span
              v-if="somatotal > toFloat(respostasof.val_orcado_atualizado)"
              class="tvermelho w700"
            >(Pressão orçamentária)</span>
          </div>
        </div>
      </div>

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
  <template v-if="OrcamentoPlanejado[ano]?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="OrcamentoPlanejado[ano]?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ OrcamentoPlanejado[ano].error }}
      </div>
    </div>
  </template>
</template>
