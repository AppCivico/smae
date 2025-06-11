<script setup>
import {
  ref, unref, onMounted, onUpdated,
} from 'vue';
import { Dashboard } from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import {
  useEditModalStore, useAlertStore, usePdMStore, usePaineisStore, usePaineisGruposStore,
} from '@/stores';
import { default as SelecionarMetas } from '@/views/paineis/SelecionarMetas.vue';
import { default as EditarMeta } from '@/views/paineis/EditarMeta.vue';
import { default as EditarDetalhe } from '@/views/paineis/EditarDetalhe.vue';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { painel_id } = route.params;

const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);
PdMStore.getActive();

const PaineisStore = usePaineisStore();
const { singlePainel } = storeToRefs(PaineisStore);
PaineisStore.clear();

const PaineisGruposStore = usePaineisGruposStore();
const { PaineisGrupos } = storeToRefs(PaineisGruposStore);
PaineisGruposStore.getAll();

const virtualCopy = ref({
  ativo: '1',
  mostrar_planejado_por_padrao: '1',
  mostrar_acumulado_por_padrao: '1',
  mostrar_indicador_por_padrao: '1',
});

let title = 'Cadastro de painel de indicador';
if (painel_id) {
  title = 'Editar painel de indicador';
  PaineisStore.getById(painel_id);
}

const buscaMeta = ref('');

const props = defineProps(['type']);
function start() {
  if (props.type == 'selecionarMetas') editModalStore.modal(SelecionarMetas, props);
  if (props.type == 'editarMeta') editModalStore.modal(EditarMeta, props);
  if (props.type == 'editarDetalhe') editModalStore.modal(EditarDetalhe, props);
}
onMounted(() => { start(); });
onUpdated(() => { start(); });

const schema = Yup.object().shape({
  nome: Yup.string().required('Preencha o nome'),
  periodicidade: Yup.string().required('Selecione a periodicidade'),
  ativo: Yup.boolean().nullable(),
  mostrar_planejado_por_padrao: Yup.boolean().nullable(),
  mostrar_acumulado_por_padrao: Yup.boolean().nullable(),
  mostrar_indicador_por_padrao: Yup.boolean().nullable(),
  grupos: Yup.array().required('Selecione ao menos um grupo'),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.ativo = !!values.ativo;
    values.mostrar_planejado_por_padrao = !!values.mostrar_planejado_por_padrao;
    values.mostrar_acumulado_por_padrao = !!values.mostrar_acumulado_por_padrao;
    values.mostrar_indicador_por_padrao = !!values.mostrar_indicador_por_padrao;

    if (painel_id) {
      r = await PaineisStore.update(painel_id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await PaineisStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      await router.push('/paineis');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/paineis');
}
async function checkDelete(painel_id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await PaineisStore.delete(painel_id)) router.push('/paineis'); }, 'Remover');
}
async function checkUnselect(painel_id, meta_id) {
  alertStore.confirmAction('Deseja mesmo esse item?', async () => {
    try {
      let r;
      const values = {
        metas: Object.values(singlePainel.value.painel_conteudo).map((x) => Number(x.meta_id)).filter((x) => x != meta_id),
      };
      r = await PaineisStore.selectMetas(painel_id, values);
      if (r == true) {
        PaineisStore.clear();
        PaineisStore.getById(painel_id);
      } else {
        throw r;
      }
    } catch (error) {
      alertStore.error(error);
    }
  }, 'Remover');
}
function removeChars(x) {
  x.target.value = x.target.value.replace(/[^a-zA-Z0-9,]/g, '');
}
function toggleAccordeon(t) {
  t.target.closest('.tzaccordeon').classList.toggle('active');
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>{{ title }}</h1>
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
    <template v-if="!(singlePainel?.loading || singlePainel?.error)">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        :initial-values="painel_id ? singlePainel : virtualCopy"
        @submit="onSubmit"
      >
        <div class="mb1">
          <label class="block">
            <Field
              name="ativo"
              type="checkbox"
              value="1"
              class="inputcheckbox"
            /><span :class="{ 'error': errors.ativo }">Painel ativo</span>
          </label>
          <div class="error-msg">
            {{ errors.ativo }}
          </div>
        </div>
        <div class="flex g2">
          <div class="f2">
            <label class="label">Nome <span class="tvermelho">*</span></label>
            <Field
              name="nome"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.nome }"
            />
            <div class="error-msg">
              {{ errors.nome }}
            </div>
          </div>
          <div class="f1">
            <label class="label">
              Periodicidade<span class="tvermelho">*</span>
            </label>
            <Field
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
        </div>
        <div class="mb2">
          <label class="mr2"><Field
            name="mostrar_planejado_por_padrao"
            type="checkbox"
            value="1"
            class="inputcheckbox"
          /><span>Exibir planejado por padrão</span></label>
          <label class="mr2"><Field
            name="mostrar_acumulado_por_padrao"
            type="checkbox"
            value="1"
            class="inputcheckbox"
          /><span>Exibir acumulado por padrão</span></label>
          <label class="mr2"><Field
            name="mostrar_indicador_por_padrao"
            type="checkbox"
            value="1"
            class="inputcheckbox"
          /><span>Exibir indicador por padrão</span></label>
        </div>
        <div class="mb2">
          <div class="label">
            Grupos de paineis de indicador
          </div>
          <template v-if="PaineisGrupos?.loading">
            <span class="spinner">Carregando</span>
          </template>
          <template v-if="PaineisGrupos.length">
            <label
              v-for="p in PaineisGrupos"
              :key="p.id"
              class="block mb1"
            >
              <Field
                name="grupos"
                class="inputcheckbox"
                type="checkbox"
                :class="{ 'error': errors.grupos }"
                :value="p.id"
                :checked="grupos && grupos.includes(p.id)"
              /><span>{{ p.nome }}</span>
            </label>
            <div class="error-msg">
              {{ errors.grupos }}
            </div>
          </template>
        </div>
        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button
            class="btn big"
            :disabled="isSubmitting"
          >
            Salvar painel
          </button>
          <hr class="ml2 f1">
        </div>
      </Form>
    </template>
    <template v-if="singlePainel?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="singlePainel?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ singlePainel.error ?? error }}
        </div>
      </div>
    </template>

    <hr class="f1 mb1 mt1">

    <h5 class="tc300 uc">
      Conteúdo
    </h5>
    <div class="search mb2">
      <input
        v-model="buscaMeta"
        placeholder="Buscar"
        type="text"
        class="inputtext"
      >
    </div>
    <table class="tablemain">
      <tbody>
        <template
          v-for="m in singlePainel.painel_conteudo"
          :key="m.meta_id"
        >
          <tr
            class="tzaccordeon"
            @click="toggleAccordeon"
          >
            <td>
              <div class="flex">
                <svg
                  class="arrow"
                  width="13"
                  height="8"
                >
                  <use xlink:href="#i_down" />
                </svg>
                <span class="w700">Meta {{ m?.meta?.codigo }} {{ m?.meta?.titulo }}</span>
              </div>
            </td>
            <td style="text-align: right; width: 90px">
              <router-link
                :to="`/paineis/${painel_id}/metas/${m.id}`"
                class="tipinfo right mr1"
              >
                <svg
                  width="20"
                  height="20"
                  class="blue"
                ><use xlink:href="#i_edit" /></svg>
                <div>Editar visualização</div>
              </router-link>
              <a
                class="tipinfo right"
                @click="checkUnselect(singlePainel.id, m.meta_id)"
              >
                <svg
                  width="20"
                  height="20"
                  class="blue"
                ><use xlink:href="#i_waste" /></svg>
                <div>Remover meta</div>
              </a>
            </td>
          </tr>
          <tz>
            <td
              colspan="56"
              style="padding-left: 0;padding: 0;"
            >
              <table class="tablemain no-border">
                <thead>
                  <tr class="no-border">
                    <th>Periodicidade</th>
                    <th>Período</th>
                    <th>Meses</th>
                    <th>Planejado</th>
                    <th>Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="no-border bgc50">
                    <td>{{ m.periodicidade }}</td>
                    <td>{{ m.periodo ?? '-' }}</td>
                    <td>{{ m.periodo_valor ?? '-' }}</td>
                    <td>{{ m.mostrar_planejado ? 'Sim' : 'Não' }}</td>
                    <td>{{ m.mostrar_acumulado ? 'Sim' : 'Não' }}</td>
                  </tr>
                </tbody>
              </table>

              <table class="tablemain no-border">
                <thead>
                  <tr>
                    <th>
                      <div class="flex center">
                        <span class="f1">Detalhamento da meta na visão de evolução</span>
                        <div
                          class="f0"
                          style="text-align: right; flex-basis: 50px;"
                        >
                          <router-link
                            :to="`/paineis/${painel_id}/metas/${m.id}/detalhes`"
                            class="tipinfo right"
                          >
                            <svg
                              width="20"
                              height="20"
                              class="blue"
                            ><use xlink:href="#i_edit" /></svg>
                            <div>Editar detalhamento</div>
                          </router-link>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody class="subtable">
                  <tr v-if="m.mostrar_indicador">
                    <th>
                      <span class="ib"><svg
                        width="20"
                        height="20"
                        class="blue mr05"
                      ><use xlink:href="#i_graf" /></svg></span> Indicador da Meta {{ m?.meta?.codigo }} {{ m?.meta?.titulo }}
                    </th>
                  </tr>
                  <tr v-if="m.detalhes.filter(y => y.tipo == 'Variavel' && !!y.mostrar_indicador).length">
                    <td class="w700">
                      Indicador da Meta {{ m?.meta?.codigo }} {{ m?.meta?.titulo }}
                    </td>
                  </tr>
                  <template
                    v-for="x in m.detalhes.filter(y => y.tipo == 'Variavel' && !!y.mostrar_indicador)"
                    :key="x.id"
                  >
                    <tr>
                      <td class="pl2">
                        Variável - {{ x.variavel.codigo ? x.variavel.codigo + ' - ' : '' }}{{ x.variavel.titulo }}
                      </td>
                    </tr>
                  </template>
                  <template
                    v-for="x in m.detalhes.filter(y => y.tipo == 'Iniciativa')"
                    :key="x.id"
                  >
                    <tr v-if="x.mostrar_indicador">
                      <th class="pl2">
                        <span class="ib"><svg
                          width="20"
                          height="20"
                          class="blue mr05"
                        ><use xlink:href="#i_graf" /></svg></span> Indicador da {{ activePdm.rotulo_iniciativa }} {{ x?.iniciativa?.codigo }} {{ x?.iniciativa?.titulo }}
                      </th>
                    </tr>
                    <tr v-if="x.filhos.filter(y => y.tipo == 'Variavel' && !!y.mostrar_indicador).length">
                      <td class="pl2 w700">
                        Indicador da {{ activePdm.rotulo_iniciativa }} {{ x?.iniciativa?.codigo }} {{ x?.iniciativa?.titulo }}
                      </td>
                    </tr>
                    <template
                      v-for="xx in x.filhos.filter(y => y.tipo == 'Variavel' && !!y.mostrar_indicador)"
                      :key="xx.id"
                    >
                      <tr>
                        <td class="pl4">
                          Variável - {{ xx.variavel.codigo ? xx.variavel.codigo + ' - ' : '' }}{{ xx.variavel.titulo }}
                        </td>
                      </tr>
                    </template>
                    <template
                      v-for="xx in x.filhos.filter(y => y.tipo == 'Atividade')"
                      :key="xx.id"
                    >
                      <tr v-if="xx.mostrar_indicador">
                        <th class="pl2">
                          <span class="ib"><svg
                            width="20"
                            height="20"
                            class="blue mr05"
                          ><use xlink:href="#i_graf" /></svg></span> Indicador da {{ activePdm.rotulo_atividade }} {{ xx?.atividade?.codigo }} {{ xx?.atividade?.titulo }}
                        </th>
                      </tr>
                      <tr v-if="xx.filhos.filter(y => y.tipo == 'Variavel' && !!y.mostrar_indicador).length">
                        <td class="pl2 w700">
                          Indicador da {{ activePdm.rotulo_atividade }} {{ xx?.atividade?.codigo }} {{ xx?.atividade?.titulo }}
                        </td>
                      </tr>
                      <template
                        v-for="xxx in xx.filhos.filter(y => y.tipo == 'Variavel' && !!y.mostrar_indicador)"
                        :key="xxx.id"
                      >
                        <tr>
                          <td class="pl4">
                            Variável - {{ xxx.variavel.codigo ? xxx.variavel.codigo + ' - ' : '' }}{{ xxx.variavel.titulo }}
                          </td>
                        </tr>
                      </template>
                    </template>
                  </template>
                </tbody>
              </table>
              <router-link
                :to="`/paineis/${painel_id}/metas/${m.id}/detalhes`"
                class="addlink mt1 ml1 mb2"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_+" /></svg><span>Detalhamento da meta</span>
              </router-link>
            </td>
          </tz>
        </template>
      </tbody>
    </table>
    <router-link
      :to="`/paineis/${painel_id}/metas`"
      class="addlink mt2"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg><span>Adicionar Meta(s)</span>
    </router-link>
    <hr class="mt1 mb2">

    <template v-if="singlePainel.id">
      <button
        class="btn amarelo big"
        @click="checkDelete(singlePainel.id)"
      >
        Remover painel
      </button>
    </template>
  </Dashboard>
</template>
