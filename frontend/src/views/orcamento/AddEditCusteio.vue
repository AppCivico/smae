<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { custeio as schema } from '@/consts/formSchemas';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useIniciativasStore } from '@/stores/iniciativas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { defineOptions, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ inheritAttrs: false });

const DotaçãoStore = useDotaçãoStore();

const alertStore = useAlertStore();
const route = useRoute();
const router = useRouter();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;
const { id } = route.params;
const { ano } = route.params;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;
const parent_item = ref(atividade_id ? singleAtividade : iniciativa_id ? singleIniciativa : meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const { OrcamentoCusteio } = storeToRefs(OrcamentosStore);
const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);
const currentEdit = ref({});

const dota = ref('');
const d_orgao = ref('');
const d_unidade = ref('');
const d_funcao = ref('');
const d_subfuncao = ref('');
const d_programa = ref('');
const d_projetoatividade = ref('');
const d_contadespesa = ref('');
const d_fonte = ref('');
const caret = ref(0);

(async () => {
  /* await */ DotaçãoStore.getDotaçãoSegmentos(ano);
  // PRA-FAZER: mover para um componente de tela acima
  switch (route.meta.entidadeMãe) {
    case 'projeto':
    case 'obras':
      await OrcamentosStore.buscarOrçamentosPrevistosParaAno();
      break;

    case 'pdm':
    case 'planoSetorial':
    case 'programaDeMetas':
      await OrcamentosStore.getOrcamentoCusteioById(meta_id, ano);
      break;

    default:
      console.trace('Módulo para busca de orçamentos não pôde ser identificado:', route.meta);
      throw new Error('Módulo para busca de orçamentos não pôde ser identificado');
  }

  if (id) {
    currentEdit.value = OrcamentoCusteio.value[ano].find((x) => x.id == id);

    currentEdit.value.parte_dotacao = await currentEdit.value.parte_dotacao.split('.').map((x, i) => {
      if (x.indexOf('*') != -1) {
        if (i == 4) {
          return '****';
        } if (i == 7) {
          return '********';
        }
      }
      return x;
    }).join('.');
    dota.value = currentEdit.value.parte_dotacao;
    validaPartes(currentEdit.value.parte_dotacao);

    currentEdit.value.location = currentEdit.value.atividade?.id ? `a${currentEdit.value.atividade.id}`
      : currentEdit.value.iniciativa?.id ? `i${currentEdit.value.iniciativa.id}`
        : currentEdit.value.meta?.id ? `m${currentEdit.value.meta.id}` : `m${meta_id}`;
  }
})();

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.meta_id = meta_id;
    values.ano_referencia = ano;

    values.parte_dotacao = values.parte_dotacao.split('.').map((x) => (x.indexOf('*') != -1 ? '*' : x)).join('.');

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
      r = await OrcamentosStore.updateOrcamentoCusteio(id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await OrcamentosStore.insertOrcamentoCusteio(values);
      msg = 'Dados salvos com sucesso!';
    }

    if (r == true) {
      alertStore.success(msg);
      if (route.meta?.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape, query: route.query });
      } else {
        await router.push({
          path: `${parentlink}/orcamento`,
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
    if (await OrcamentosStore.deleteOrcamentoCusteio(id, route.params)) {
      if (parentlink) {
        router.push({
          path: `${parentlink}/orcamento/custo`,
          query: route.query,
        });
      } else if (route.meta?.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape, query: route.query });
      }
    }
  }, 'Remover');
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

</script>
<template>
  <div class="flex spacebetween center">
    <h1>Previsão de custo</h1>
    <hr class="ml2 f1">

    <CheckClose />
  </div>
  <h3 class="mb2">
    <strong>{{ ano }}</strong> - {{ parent_item.codigo }} - {{ parent_item.titulo }}
  </h3>
  <template v-if="!(OrcamentoCusteio[ano]?.loading || OrcamentoCusteio[ano]?.error)">
    <Form
      v-slot="{ errors, isSubmitting, values }"
      :validation-schema="schema"
      :initial-values="currentEdit"
      @submit="onSubmit"
    >
      <div class="flex center g2 mb2">
        <div class="f1">
          <label class="label">Dotação orcamentária <span class="tvermelho">*</span></label>
          <Field
            v-model="dota"
            name="parte_dotacao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.parte_dotacao }"
            @keyup="maskDotacao"
          />
          <div class="error-msg">
            {{ errors.parte_dotacao }}
          </div>
          <div class="t13 tc500">
            Obrigatório informar os campos <strong>Órgão</strong>,
            <strong>Unidade</strong>, <strong>Função</strong>,
            <strong>Projeto/Atividade</strong> e <strong>Fonte</strong>. Os
            demais são opcionais. Por exemplo:
            <var>98.22.15.122.****.5.287.********.08</var>
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
              :disabled="!d_orgao"
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
            <label class="label tc300">Programa</label>
            <Field
              v-model="d_programa"
              name="d_programa"
              as="select"
              class="inputtext light mb1"
              @change="montaDotacao"
            >
              <option value="****">
                ****
              </option>
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
            <label class="label tc300">Conta despesa</label>
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

      <div v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)">
        <hr class="mt2 mb2">
        <label class="label">Vincular dotação <span class="tvermelho">*</span></label>

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

      <hr class="mt2 mb2">
      <div class="flex g2 mb2">
        <div class="f1">
          <label class="label">Previsão de custo <span class="tvermelho">*</span></label>
          <MaskedFloatInput
            name="custo_previsto"
            :value="values.custo_previsto"
            class="inputtext light mb1"
            :class="{ 'error': errors.custo_previsto }"
          />
          <div
            v-show="errors.custo_previsto"
            class="error-msg"
          >
            {{ errors.custo_previsto }}
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
    </Form>
  </template>
  <template v-if="currentEdit.id">
    <button
      class="btn amarelo big"
      @click="checkDelete(currentEdit.id)"
    >
      Remover item
    </button>
  </template>
  <template v-if="OrcamentoCusteio[ano]?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="OrcamentoCusteio[ano]?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ OrcamentoCusteio[ano].error }}
      </div>
    </div>
  </template>
</template>
