<script setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';
import { useAlertStore } from '@/stores/alert.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';
import { localizarDataHorario } from '@/helpers/dateToDate';
import dateToField from '@/helpers/dateToField';
import SmallModal from '@/components/SmallModal.vue';
import TextoComBotao from '@/components/TextoComBotao.vue';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const alertStore = useAlertStore();

const workflowAndamento = useWorkflowAndamentoStore();
const {
  workflow,
  chamadasPendentes,
  etapaEmFoco,
  historico: historicoDoWorkflow,
} = storeToRefs(workflowAndamento);

const configurarWorkflow = ref(false);
const tabRefs = ref([]);

watch(
  () => workflow.value?.fluxo?.length,
  () => {
    tabRefs.value = [];
  },
  { immediate: true },
);

function setTabRef(el) {
  if (el && !tabRefs.value.includes(el)) {
    tabRefs.value.push(el);
  }
}

function handleKeydown(event, index) {
  const total = tabRefs.value.length;
  let newIndex = index;

  switch (event.key) {
    case 'ArrowRight':
    case 'Right':
      newIndex = (index + 1) % total;
      break;
    case 'ArrowLeft':
    case 'Left':
      newIndex = (index - 1 + total) % total;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = total - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  const novaEtapa = workflow.value.fluxo[newIndex];
  workflowAndamento.setEtapaEmFoco(novaEtapa.id);
  tabRefs.value[newIndex]?.focus();
}

workflowAndamento.buscar();

function abrirConfigurarWorkflow() {
  workflowAndamento.buscarHistorico();
  configurarWorkflow.value = true;
}

function reabrirFase() {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await workflowAndamento.reabrirFase()) {
      await workflowAndamento.buscar();
      alertStore.success('Fase reaberta!');
    }
  }, 'Reabrir');
}

function deletarWorkflow() {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await workflowAndamento.deletarWorkflow()) {
      await workflowAndamento.buscar();
      alertStore.success('Workflow deletado!');
      configurarWorkflow.value = false;
    }
  }, 'Deletar');
}

function formatarTexto(texto) {
  if (!texto) {
    return '';
  }
  return texto.replace(/([a-z])([A-Z])/g, '$1 $2');
}
</script>
<template>
  <div>
    <TextoComBotao>
      <template #texto>
        <p class="t20 mb0">
          Estas são as <strong>etapas</strong>, você pode navegar entre elas.
        </p>
        <p class="t20 mb0">
          Se for necessário <strong>reabrir a fase anterior</strong> ou
          <strong>excluir o workflow</strong>, clique em <strong>"Configurar Workflow"</strong>
        </p>
      </template>
      <template #botao>
        <button
          v-if="workflow && temPermissãoPara('CadastroWorkflows.editar')"
          type="button"
          class="btn bgnone outline tcprimary"
          @click="abrirConfigurarWorkflow"
        >
          configurar workflow
        </button>
      </template>
    </TextoComBotao>

    <LoadingComponent
      v-if="chamadasPendentes?.workflow"
      class="horizontal"
    />
    <template
      v-else
    >
      <p
        v-if="!workflow?.fluxo?.length"
      >
        Nenhuma etapa encontrada.
      </p>
      <ol
        v-else
        ref="listaDeEtapas"
        role="tablist"
        class="flex varal-etapas mt05 pb0 mb0"
      >
        <li
          v-for="(item, index) in workflow.fluxo"
          :key="item.id"
          class="tc varal-etapas__etapa"
          :class="{
            'varal-etapas__etapa--atual': item?.atual,
            'varal-etapas__etapa--concluida': !!item?.concluida,
            'varal-etapas__etapa--selecionada': item.id === etapaEmFoco?.id
          }"
        >
          <button
            :id="`tab-${item.id}`"
            :ref="setTabRef"
            type="button"
            role="tab"
            :aria-selected="item.id === etapaEmFoco?.id"
            :aria-controls="`panel-${item.id}`"
            :tabindex="item.id === etapaEmFoco?.id ? '0' : '-1'"
            class="w400 like-a__text varal-etapas__nome-da-etapa"
            @click="workflowAndamento.setEtapaEmFoco(item.id)"
            @keydown="handleKeydown($event, index)"
          >
            <span class="w400">Etapa {{ item.atual ? 'atual' : '' }}</span>
            {{ item.workflow_etapa_de.descricao }}
          </button>
        </li>
      </ol>
    </template>
    <SmallModal v-if="configurarWorkflow">
      <div class="flex spacebetween center mb2">
        <h2>
          Configurar Workflow
        </h2>
        <hr class="ml2 f1">

        <CheckClose
          :apenas-modal="true"
          :formulario-sujo="false"
          @close="configurarWorkflow = false"
        />
      </div>
      <div v-if="historicoDoWorkflow?.linhas?.length">
        <div
          v-for="(linha, index) in historicoDoWorkflow?.linhas"
          :key="index"
          class="mb2"
        >
          <div v-if="linha.acao==='DelecaoWorkflow'">
            <strong class="tc600">
              <span class="tamarelo mr1">DELEÇÃO WORKFLOW </span>
              {{ linha.criador?.nome_exibicao }} - {{ localizarDataHorario(linha.criado_em) }}
            </strong>
          </div>
          <div v-if="linha.acao==='TrocaTipo'">
            <strong class="tc600">
              <span class="tamarelo mr1">
                TROCA TIPO
              </span>
              {{ linha.criador?.nome_exibicao }} - {{ localizarDataHorario(linha.criado_em) }}
            </strong>
            <div class="flex mt1">
              <dl class="mr2">
                <p class="tc500 w700 mb0">
                  Informação anterior
                </p>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Nome:
                  </dt>
                  <dd> {{ linha.tipo_antigo.nome }}</dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Esfera:
                  </dt>
                  <dd>{{ linha.tipo_antigo.esfera }} </dd>
                </div>
              </dl>
              <dl>
                <p class="tc500 w700 mb0">
                  Informação nova
                </p>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Nome:
                  </dt>
                  <dd> {{ linha.tipo_novo.nome }}</dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Esfera:
                  </dt>
                  <dd>{{ linha.tipo_novo.esfera }} </dd>
                </div>
              </dl>
            </div>
          </div>
          <div v-if="linha.acao==='ReaberturaFaseWorkflow'">
            <strong class="tc600 uc">
              <span class="tamarelo mr1">
                ABERTURA FASE:
              </span>
              {{ formatarTexto(linha.dados_extra?.faseReaberta?.fase) || ' - ' }}
            </strong> <br>
            <strong class="tc600">
              {{ linha.criador?.nome_exibicao }} - {{ localizarDataHorario(linha.criado_em) }}
            </strong>
            <div class="flex mt1">
              <dl class="mr2">
                <p class="tc500 w700 mb0">
                  Fase reaberta
                </p>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Órgão responsável:
                  </dt>
                  <dd>{{ linha.dados_extra?.faseReaberta?.orgao_responsavel?.sigla || ' - ' }}</dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Pessoa responsável:
                  </dt>
                  <dd>
                    {{
                      linha.dados_extra?.faseReaberta?.pessoa_responsavel?.nome_exibicao || ' - '
                    }}
                  </dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Data de início:
                  </dt>
                  <dd>{{ dateToField(linha.dados_extra?.faseReaberta?.data_inicio) || ' - ' }} </dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Situação:
                  </dt>
                  <dd>
                    {{ formatarTexto(
                      linha.dados_extra?.faseReaberta?.situacao?.tipo_situacao
                    ) || ' - ' }}
                  </dd>
                </div>
              </dl>
              <dl
                v-if="linha.dados_extra?.faseIncompleta"
                class="mr2"
              >
                <p class="tc500 w700 mb0">
                  Fase incompleta
                </p>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Órgão responsável:
                  </dt>
                  <dd>
                    {{ linha.dados_extra?.faseIncompleta?.orgao_responsavel?.sigla || ' - ' }}
                  </dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Pessoa responsável:
                  </dt>
                  <dd>
                    {{
                      linha.dados_extra?.faseIncompleta?.pessoa_responsavel?.nome_exibicao || ' - '
                    }}
                  </dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Data de início:
                  </dt>
                  <dd>
                    {{ dateToField(linha.dados_extra?.faseIncompleta?.data_inicio) || ' - ' }}
                  </dd>
                </div>
                <div class="flex mt05">
                  <dt class="w700 mr1">
                    Situação:
                  </dt>
                  <dd>
                    {{ formatarTexto(
                      linha.dados_extra?.faseIncompleta?.situacao?.tipo_situacao
                    ) || ' - ' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="mb1"
      >
        Este workflow ainda <strong>não</strong> possui histórico.
      </div>
      <div class="flex justifycenter">
        <button
          type="button"
          class="btn bgnone outline tvermelho mr1"
          @click="deletarWorkflow()"
        >
          fechar e deletar workflow
        </button>
        <button
          v-if="workflow?.pode_reabrir_fase"
          type="button"
          class="btn mr1"
          @click="reabrirFase()"
        >
          reabrir fase
        </button>
        <button
          type="button"
          class="btn"
          @click="configurarWorkflow = false"
        >
          fechar
        </button>
      </div>
      <div />
    </SmallModal>
  </div>
</template>
<style scoped lang="less">
.varal-etapas {
  display: flex;
  align-items: flex-start;
  position: relative;
  overflow-x: auto;
  padding: 2rem;
  counter-reset: varal-etapas;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #888 #f0f0f0;

  &::after {
    content: '';
    width: 100%;
    height: 6px;
    position: absolute;
    top: 4.55rem;
    left: 0;
    z-index: -2;
    background-color: #c8c8c8;
  }
}

.varal-etapas__etapa {
  display: grid;
  align-items: center;
  justify-items: start;
  gap: 1.2rem;
  position: relative;
  min-height: 170px;
  padding: 1rem 6rem 1.5rem 1.5rem;

  &::before {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 3.5rem;
    aspect-ratio: 1;
    background-color: #c8c8c8;
    border-radius: 100%;
    font-weight: 700;
    counter-increment: varal-etapas;
    content: counter(varal-etapas);
  }

  &:nth-child(-n+9)::before {
    content: '0'counter(varal-etapas);
  }

  &::after {
    content: '';
    width: 100%;
    height: 6px;
    position: absolute;
    top: 2.55rem;
    z-index: -1;
    background-color: #c8c8c8;
  }
}

.varal-etapas__etapa--concluida {
  &::before {
    background-color: @amarelo;
  }
}

.varal-etapas__etapa--atual {
  &::before {
    background-color: @amarelo;
  }
}

.varal-etapas__etapa--selecionada {
  &::after {
    background-color: @amarelo;
  }
}

.varal-etapas__nome-da-etapa {
  display: grid;
  gap: 0.4rem;
  padding-block-end: 1rem;
  padding-inline: 1rem;
  text-align: start;
  font-weight: 700;
  font-size: 1rem;
  width: max-content;
}

.varal-etapas__nome-da-etapa span {
  &::before {
    content: '';
    position: absolute;
    inset: 1rem;
  }
}

.varal-etapas__etapa--selecionada .varal-etapas__nome-da-etapa span {
  &::before {
    background-image: url('@{u}/icons/fase-ativa-bg.svg');
    background-repeat: no-repeat;
    // hardcoded em px porque tá complicado
    background-size: 93px 118px;
    background-position: 100% 23px;
  }
}
</style>
