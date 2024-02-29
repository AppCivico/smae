<script setup>
import agrupadorDeVariáveis from '@/helpers/agrupadorDeVariaveis';
import { Dashboard } from '@/components';
import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import { default as countVars } from '@/components/monitoramento/countVars.vue';
import { default as listVars } from '@/components/monitoramento/listVars.vue';
import listCompostas from '@/components/monitoramento/listCompostas.vue';
import { default as modalAnaliseRisco } from '@/components/monitoramento/modalAnaliseRisco.vue';
import { default as modalFechamento } from '@/components/monitoramento/modalFechamento.vue';
import { default as modalQualificacaoMeta } from '@/components/monitoramento/modalQualificacaoMeta.vue';
import { default as modalRealizado } from '@/components/monitoramento/modalRealizado.vue';
import modalRealizadoEmLote from '@/components/monitoramento/modalRealizadoEmLote.vue';
import { default as sidebarRealizado } from '@/components/monitoramento/sidebarRealizado.vue';
import { auxiliarDePreenchimentoDeEvoluçãoDeMeta as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { usePdMStore } from '@/stores/pdm.store';
import { useSideBarStore } from '@/stores/sideBar.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const route = useRoute();
const { meta_id } = route.params;

const SideBarStore = useSideBarStore();
const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

const CiclosStore = useCiclosStore();
const {
  SingleMeta,
  MetaVars,
  SingleMetaAnalise,
  SingleMetaAnaliseDocs,
  SingleRisco,
  SingleFechamento,
  chamadasPendentes,
} = storeToRefs(CiclosStore);

async function iniciar() {
  CiclosStore.$reset();
  CiclosStore.getMetaById(meta_id);
  CiclosStore.getMetaVars(meta_id);

  if (!activePdm.value.id) await PdMStore.getActive();

  if (perm.PDM?.admin_cp || perm.PDM?.tecnico_cp) {
    CiclosStore.getMetaAnalise(activePdm.value.ciclo_fisico_ativo.id, meta_id);
    CiclosStore.getMetaRisco(activePdm.value.ciclo_fisico_ativo.id, meta_id);
    CiclosStore.getMetaFechamento(activePdm.value.ciclo_fisico_ativo.id, meta_id);
  }
}

function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.clear();
    alertStore.clear();
  });
}
function editPeriodo(parent, var_id, periodo) {
  editModalStore.clear();
  editModalStore.modal(modalRealizado, {
    parent, var_id, periodo, checkClose,
  });
}

function editPeriodoEmLote(parent, variávelComposta, params) {
  editModalStore.clear();
  editModalStore.modal(modalRealizadoEmLote, {
    parent, variávelComposta, params, checkClose,
  });
}

function abrePeriodo(parent, var_id, periodo) {
  SideBarStore.clear();
  SideBarStore.modal(sidebarRealizado, { parent, var_id, periodo });
}
function confirmFase(id, f) {
  const z = activePdm.value.ciclo_fisico_ativo.fases.find((x) => x.ciclo_fase == f);

  if (z) {
    alertStore.confirmAction(
      'Deseja mesmo avançar a etapa?',
      async () => {
        alertStore.clear();
        await CiclosStore.updateFase(id, { ciclo_fase_id: z.id }); router.go();
      },
      'Avançar',
      () => { alertStore.clear(); },
    );
  }
}

function fecharciclo(ciclo_id, meta_id, parent) {
  editModalStore.clear();
  editModalStore.modal(modalFechamento, {
    ciclo_id, meta_id, parent, checkClose,
  });
}
function analisederisco(ciclo_id, meta_id, parent) {
  editModalStore.clear();
  editModalStore.modal(modalAnaliseRisco, {
    ciclo_id, meta_id, parent, checkClose,
  });
}
function qualificar(ciclo_id, meta_id, parent) {
  editModalStore.clear();
  editModalStore.modal(modalQualificacaoMeta, {
    ciclo_id, meta_id, parent, checkClose,
  });
}
function vazio(s) {
  return s || '-';
}

async function onSubmit(values) {
  try {
    const msg = 'Dados salvos com sucesso!';
    const r = await CiclosStore.preencherValoresVazios(values);

    if (r) {
      alertStore.success(msg);
      CiclosStore.$reset();
      iniciar();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function submeterACoordenadoriaDePlanejamento() {
  try {
    const msg = 'Dados salvos com sucesso!';
    const r = await CiclosStore.submeterACoordenadoriaDePlanejamento({
      meta_id: Number(meta_id),
    });

    if (r) {
      alertStore.success(msg);
      CiclosStore.$reset();
      iniciar();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function preencherVaziosCom(values) {
  if (values.valor_realizado !== null) {
    CiclosStore.valoresNovos.valorRealizado = values.valor_realizado;
  }

  if (values.valor_realizado_acumulado !== null) {
    CiclosStore.valoresNovos.valorRealizadoAcumulado = values.valor_realizado_acumulado;
  }
}
iniciar();
</script>
<template>
  <Dashboard>
    <div class="label tamarelo">
      Evolução da Meta
    </div>

    <div class="mb2">
      <div class="flex spacebetween center">
        <h2>Meta {{ SingleMeta.codigo }} - {{ SingleMeta.titulo }}</h2>
        <hr class="ml2 f1">
        <div
          v-if="(perm.PDM?.admin_cp || perm.PDM?.tecnico_cp)
            && Array.isArray(MetaVars.avancarFases) && MetaVars.avancarFases?.length"
          class="ml2 dropbtn"
        >
          <span class="btn">Avançar etapa</span>
          <ul>
            <li v-if="MetaVars.avancarFases.includes('Analise')">
              <button
                type="button"
                class="like-a__link"
                @click="confirmFase(SingleMeta.id, 'Analise')"
              >
                Qualificação
              </button>
            </li>
            <li v-if="MetaVars.avancarFases.includes('Risco')">
              <button
                type="button"
                class="like-a__link"
                @click="confirmFase(SingleMeta.id, 'Risco')"
              >
                Análise de Risco
              </button>
            </li>
            <li v-if="MetaVars.avancarFases.includes('Fechamento')">
              <button
                type="button"
                class="like-a__link"
                @click="confirmFase(SingleMeta.id, 'Fechamento')"
              >
                Fechamento
              </button>
            </li>
          </ul>
        </div>

        <button
          v-if="MetaVars.perfil === 'ponto_focal' && MetaVars.botao_enviar_cp"
          class="btn big ml2"
          :disabled="chamadasPendentes.submeterACoordenadoriaDePlanejamento"
          @click="submeterACoordenadoriaDePlanejamento()"
        >
          Submeter
        </button>
      </div>
    </div>

    <auxiliarDePreenchimento>
      <Form
        v-slot="{ errors, isSubmitting, values }"
        :validation-schema="schema"
        @submit="onSubmit"
      >
        <Field
          name="meta_id"
          type="hidden"
          :value="Number($route.params.meta_id)"
        />

        <Field
          name="enviar_cp"
          type="hidden"
          :value="false"
        />

        <legend class="label mt2 mb1">
          Valores a aplicar
        </legend>

        <div class="flex g2 end mb1">
          <div class="f1">
            <LabelFromYup
              :schema="schema"
              name="valor_realizado"
              class="label tc300"
            />
            <Field
              name="valor_realizado"
              type="number"
              min="0"
              class="inputtext light mb1"
            />
            <ErrorMessage
              name="valor_realizado"
              class="error-msg mb1"
            />
          </div>
          <div class="f1">
            <LabelFromYup
              :schema="schema"
              name="valor_realizado_acumulado"
              class="label tc300"
            />
            <Field
              name="valor_realizado_acumulado"
              type="number"
              min="0"
              class="inputtext light mb1"
            />
            <ErrorMessage
              name="valor_realizado_acumulado"
              class="error-msg mb1"
            />
          </div>
        </div>

        <FormErrorsList :errors="errors" />

        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button
            type="button"
            class="f0 mr1 btn bgnone outline"
            :disabled="isSubmitting || Object.keys(errors)?.length"
            :title="Object.keys(errors)?.length
              ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
              : null"
            name="enviar_cp"
            :value="false"
            @click="preencherVaziosCom(values)"
          >
            Preencher vazios
          </button>
          <button
            type="submit"
            class="btn outline bgnone tcprimary mr1"
            :disabled="isSubmitting || Object.keys(errors)?.length"
            :title="Object.keys(errors)?.length
              ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
              : null"
          >
            Salvar
          </button>
          <button
            v-if="perm.PDM?.ponto_focal"
            class="btn"
            type="button"
            :disabled="isSubmitting
              || Object.keys(errors)?.length"
            :title="Object.keys(errors)?.length
              ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
              : null"
            @click="onSubmit({ ...values, enviar_cp: true })"
          >
            Salvar e submeter
          </button>
          <hr class="ml2 f1">
        </div>

        <div class="flex g2 end" />
      </Form>
    </auxiliarDePreenchimento>

    <div
      v-if="SingleFechamento?.id"
      class="mb2"
    >
      <div class="flex spacebetween center mb1">
        <h2>Fechamento do Ciclo</h2>
        <hr class="ml2 f1">
        <a
          v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)"
          class="tprimary ml1"
          @click="fecharciclo(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"
        ><svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg></a>
      </div>
      <div class="label tc300">
        Comentários
      </div>
      <div class="mb2">
        {{ vazio(SingleFechamento.comentario) }}
      </div>

      <div class="label tc300">
        Fechado por
      </div>
      <div
        class="contentStyle mb2"
      >
        <strong>{{ SingleFechamento.criador?.nome_exibicao || SingleFechamento.criador }}</strong>
        em <time :datetime="SingleFechamento.criado_em">
          {{ dateToField(SingleFechamento.criado_em) }}
        </time>
      </div>
    </div>
    <div v-else-if="SingleFechamento.loading">
      <span class="spinner">Carregando</span>
    </div>
    <div
      v-else-if="(perm.PDM?.admin_cp || perm.PDM?.tecnico_cp) &&
        MetaVars.permissoes?.fechamento"
      class="p1 bgc50 tc mb2"
    >
      <button
        type="button"
        class="btn"
        @click="fecharciclo(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"
      >
        Fechar ciclo
      </button>
    </div>

    <div
      v-if="SingleRisco.id"
      class="mb2"
    >
      <div class="flex spacebetween center mb1">
        <h2>Análise de Risco</h2>
        <hr class="ml2 f1">
        <a
          v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)"
          class="tprimary ml1"
          @click="analisederisco(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"
        ><svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg></a>
      </div>
      <div class="label tc300">
        Detalhamento
      </div>
      <div
        class="contentStyle mb2"
        v-html="SingleRisco.detalhamento || '-'"
      />
      <div class="label tc300">
        Pontos de atenção
      </div>
      <div
        class="contentStyle mb2"
        v-html="SingleRisco.ponto_de_atencao || '-'"
      />

      <div class="label tc300">
        Analisado por
      </div>
      <div
        class="contentStyle mb2"
      >
        <strong>{{ SingleRisco.criador?.nome_exibicao || SingleRisco.criador }}</strong>
        em <time :datetime="SingleRisco.criado_em">
          {{ dateToField(SingleRisco.criado_em) }}
        </time>
      </div>
    </div>
    <div v-else-if="SingleRisco.loading">
      <span class="spinner">Carregando</span>
    </div>
    <div
      v-else-if="(perm.PDM?.admin_cp || perm.PDM?.tecnico_cp) && MetaVars.permissoes?.risco"
      class="p1 bgc50 tc mb2"
    >
      <button
        type="button"
        class="btn"
        @click="analisederisco(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"
      >
        Adicionar Análise de Risco
      </button>
    </div>

    <div
      v-if="SingleMetaAnalise.id"
      class="mb2"
    >
      <div class="flex spacebetween center mb1">
        <h2>Qualificação</h2>
        <hr class="ml2 f1">
        <a
          v-if="(perm.PDM?.admin_cp||perm.PDM?.tecnico_cp)"
          class="tprimary ml1"
          @click="qualificar(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"
        ><svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg></a>
      </div>
      <div class="label tc300">
        Informações complementares
      </div>
      <div class="mb2">
        {{ vazio(SingleMetaAnalise.informacoes_complementares) }}
      </div>

      <div class="label tc300">
        Qualificado por
      </div>
      <div
        class="contentStyle mb2"
      >
        <strong>{{ SingleMetaAnalise.criador?.nome_exibicao || SingleMetaAnalise.criador }}</strong>
        em <time :datetime="SingleMetaAnalise.criado_em">
          {{ dateToField(SingleMetaAnalise.criado_em) }}
        </time>
      </div>

      <table class="tablemain mt2 mb2 pl0">
        <thead>
          <tr>
            <th style="width: 30%">
              Documentos relacionados
            </th>
            <th style="width: 70%">
              Descrição
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="SingleMetaAnaliseDocs.length">
            <tr
              v-for="subitem in SingleMetaAnaliseDocs"
              :key="subitem.id"
            >
              <td>
                <a
                  :href="baseUrl+'/download/'+subitem?.arquivo?.download_token"
                  download
                >{{ vazio(subitem?.arquivo?.nome_original) }}</a>
              </td>
              <td>
                <a
                  :href="baseUrl+'/download/'+subitem?.arquivo?.download_token"
                  download
                >{{ vazio(subitem?.arquivo?.descricao) }}</a>
              </td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="60">
              Nenhum arquivo adicionado
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="SingleMetaAnalise.loading">
      <span class="spinner">Carregando</span>
    </div>

    <div
      v-else-if="(perm.PDM?.admin_cp || perm.PDM?.tecnico_cp)
        && MetaVars.permissoes?.analiseQualitativa"
      class="p1 bgc50 tc mb2"
    >
      <button
        type="button"
        class="btn"
        @click="qualificar(activePdm.ciclo_fisico_ativo.id,meta_id,SingleMeta)"
      >
        Qualificar
      </button>
    </div>

    <div class="boards">
      <template v-if="MetaVars.meta">
        <countVars :list="MetaVars.meta.totais" />
        <div
          v-if="MetaVars.meta.indicador"
          class="mb4"
        >
          <header
            class="p1 mb3"
            style="
            border-top: 8px solid #F2890D;
            border-right: 1px solid #E3E5E8;
            border-left: 1px solid #E3E5E8;
          "
          >
            <div class="flex center g2">
              <a class="flex center f1 g2">
                <svg
                  class="f0 tlaranja"
                  style="flex-basis: 2rem;"
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                ><use xlink:href="#i_indicador" /></svg>
                <h2 class="mt1 mb1">
                  {{ MetaVars.meta.indicador.codigo }}
                  {{ MetaVars.meta.indicador.titulo }}
                </h2>
              </a>
            </div>
          </header>

          <listCompostas
            :parent="MetaVars.meta"
            :list="agrupadorDeVariáveis(MetaVars?.meta?.variaveis).compostas"
            :indexes="MetaVars.ordem_series"
            :edit-periodo="editPeriodo"
            :edit-periodo-em-lote="editPeriodoEmLote"
            :abre-periodo="abrePeriodo"
          />

          <listVars
            :parent="MetaVars.meta"
            :list="agrupadorDeVariáveis(MetaVars?.meta?.variaveis).órfãs"
            :indexes="MetaVars.ordem_series"
            :edit-periodo="editPeriodo"
            :abre-periodo="abrePeriodo"
          />
        </div>
        <template v-if="MetaVars.meta.iniciativas.length">
          <div class="flex spacebetween center mt4 mb2">
            <h2 class="mb0">
              {{ activePdm.rotulo_iniciativa }}(s) e {{ activePdm.rotulo_atividade }}(s)
            </h2>
            <hr class="ml2 f1">
          </div>
          <template
            v-for="ini in MetaVars.meta.iniciativas"
            :key="ini.iniciativa.id"
          >
            <countVars :list="ini.totais" />
            <div class="mb4">
              <header class="board_variavel mb3 p1">
                <div class="flex center g2 mb1">
                  <a
                    class="f0"
                    style="flex-basis: 2rem;"
                  >
                    <svg
                      width="28"
                      height="33"
                      viewBox="0 0 32 38"
                      color="#8EC122"
                      xmlns="http://www.w3.org/2000/svg"
                    ><use xlink:href="#i_iniciativa" /></svg>
                  </a>
                  <a class="f1 mt1">
                    <h2 class="mb1">{{ ini.iniciativa.codigo }} {{ ini.iniciativa.titulo }}</h2>
                  </a>
                </div>
              </header>

              <listCompostas
                :parent="ini"
                :list="agrupadorDeVariáveis(ini.variaveis).compostas"
                :indexes="MetaVars.ordem_series"
                :edit-periodo="editPeriodo"
                :edit-periodo-em-lote="editPeriodoEmLote"
                :abre-periodo="abrePeriodo"
              />

              <listVars
                :parent="ini"
                :list="agrupadorDeVariáveis(ini.variaveis).órfãs"
                :indexes="MetaVars.ordem_series"
                :edit-periodo="editPeriodo"
                :abre-periodo="abrePeriodo"
              />
            </div>
            <p
              v-if="ini.atividades.length"
              class="label mb2"
            >
              {{ activePdm.rotulo_atividade }}(s)
              em {{ activePdm.rotulo_iniciativa }} {{ ini.iniciativa.codigo }}
              {{ ini.iniciativa.titulo }}
            </p>
            <template
              v-for="ati in ini.atividades"
              :key="ati.atividade.id"
            >
              <countVars :list="ati.totais" />
              <div class="mb4">
                <header class="board_variavel mb3 p1">
                  <div class="flex center g2 mb1">
                    <a
                      class="f0"
                      style="flex-basis: 2rem;"
                    >
                      <svg
                        width="28"
                        height="33"
                        viewBox="0 0 32 38"
                        color="#8EC122"
                        xmlns="http://www.w3.org/2000/svg"
                      ><use xlink:href="#i_atividade" /></svg>
                    </a>
                    <a class="f1 mt1">
                      <h2 class="mb1">{{ ati.atividade.codigo }} {{ ati.atividade.titulo }}</h2>
                    </a>
                  </div>
                </header>

                <listCompostas
                  :parent="ati"
                  :list="agrupadorDeVariáveis(ati.variaveis).compostas"
                  :indexes="MetaVars.ordem_series"
                  :edit-periodo="editPeriodo"
                  :edit-periodo-em-lote="editPeriodoEmLote"
                  :abre-periodo="abrePeriodo"
                />

                <listVars
                  :parent="ati"
                  :list="agrupadorDeVariáveis(ati.variaveis).órfãs"
                  :indexes="MetaVars.ordem_series"
                  :edit-periodo="editPeriodo"
                  :abre-periodo="abrePeriodo"
                />
              </div>
            </template>
          </template>
        </template>
      </template>
      <template v-else-if="MetaVars.loading">
        <div class="p1">
          <span>Carregando</span> <svg
            class="ml1 ib"
            width="20"
            height="20"
          ><use xlink:href="#i_spin" /></svg>
        </div>
      </template>
      <template v-else-if="MetaVars.error">
        <div class="error p1">
          <p class="error-msg">
            Error: {{ MetaVars.error }}
          </p>
        </div>
      </template>
      <template v-else>
        <div class="error p1">
          <p class="error-msg">
            Nenhum item encontrado.
          </p>
        </div>
      </template>
    </div>
  </Dashboard>
</template>
