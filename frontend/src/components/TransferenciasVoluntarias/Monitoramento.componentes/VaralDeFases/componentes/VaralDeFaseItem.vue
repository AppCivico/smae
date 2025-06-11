<script lang="ts" setup>
import { ref } from 'vue';
import EdicaoTarefaComCronogramaModal, { type EdicaoTarefaComCronogramaModalExposed } from './EdicaoTarefaComCronogramaModal.vue';

export type FaseTipo = 'fase' | 'tarefa-cronograma' | 'tarefa-workflow';
export type DadosTarefa = {
  faseMaeId: number,
  inicioReal?: string,
};

export type VaralDeItemProps = {
  id: number,
  dadosTarefa?: {
    faseMaeId: number,
    inicioReal?: string
  },
  titulo: string,
  duracao?: number,
  responsavel?: {
    id: string,
    sigla: string,
    descricao: string,
  },
  pessoaResponsavel?: {
    id: number,
    nome_exibicao: string,
  },
  situacao?: {
    id: number,
    situacao: string,
    tipo_situacao: string
  },
  tarefas?: any[]
  situacoes?: any[]
  atual?: boolean,
  concluida?: boolean,
  podeConcluir?: boolean,
  bloqueado?: boolean,
  tipo: FaseTipo
};

type Props = VaralDeItemProps & {
  secundario?: boolean,
  largo?: boolean
};

const props = defineProps<Props>();

const edicaoModal = ref<EdicaoTarefaComCronogramaModalExposed | undefined>();

function handleEditar() {
  edicaoModal.value?.abrirModalFase({
    id: props.id,
    secundario: props.secundario,
    orgao_responsavel: props.responsavel,
    situacao: props.situacao,
    pessoa_responsavel: props.pessoaResponsavel,
    situacoes: props.situacoes,
    tipo: props.tipo,
    dadosTarefa: props.dadosTarefa,
  });
}

</script>

<template>
  <article
    :class="[
      'varal-de-fase-item__raiz'
    ]"
  >
    <section
      class="varal-de-fase-item"
      :class="[
        {'varal-de-fase-item--largo': $props.largo},
        { 'varal-de-fase-item--secundario': $props.secundario },
        { 'varal-de-fase-item--atual': $props.atual },
        { 'varal-de-fase-item--bloqueado': $props.bloqueado },
      ]"
    >
      <dt
        v-if="!$props.largo && !$props.secundario"
        class="varal-de-fase-item__titulo"
      >
        <div
          v-if="$props.atual"
          class="smae-tooltip smae-tooltip--direito"
        >
          <span class="smae-tooltip__conteudo">Fase atual</span>
        </div>

        {{ $props.titulo }}
      </dt>

      <div class="varal-de-fase-item__conteudo">
        <!-- {{ tipo }} -->
        <dt
          v-if="$props.largo || $props.secundario"
          class="varal-de-fase-item__titulo"
        >
          <span
            v-if="$props.secundario"
            class="varal-de-fase-item__titulo-situacao"
          />

          {{ $props.titulo }}
        </dt>

        <dd>
          <dl class="varal-de-fase-item__lista">
            <div
              v-if="$props.duracao !== undefined"
              class="varal-de-fase-item__item varal-de-fase-item__item--duracao"
            >
              <dt>Duração</dt>

              <dd>{{ $props.duracao }} d</dd>
            </div>

            <div class="varal-de-fase-item__item">
              <dt>Responsável</dt>

              <dd>{{ $props.responsavel?.sigla || '-' }}</dd>
            </div>

            <div class="varal-de-fase-item__item">
              <dt v-if="!props.secundario">
                Situação
              </dt>

              <dd>{{ $props.situacao?.situacao || '-' }}</dd>
            </div>
          </dl>
        </dd>

        <div
          v-if="$props.atual && !$props.concluida && !$props.bloqueado"
          class="varal-de-fase-item__agrupador-botoes"
        >
          <button
            class="varal-de-fase-item__botao"
            type="button"
            @click="handleEditar"
          >
            Editar
          </button>
        </div>
      </div>
    </section>

    <div
      v-if="$props.tarefas?.length"
      class="varal-de-fase-item__tarefas"
    >
      <template
        v-for="(tarefa, tarefaIndex) in $props.tarefas"
        :key="`fase--${tarefaIndex}`"
      >
        <VaralDeFaseItem
          :id="tarefa.tarefa_cronograma_id || tarefa.workflow_tarefa.id"
          secundario
          :titulo="tarefa.workflow_tarefa?.descricao"
          :situacao="tarefa.tipo_situacao"
          :responsavel="tarefa.andamento.orgao_responsavel"
          :atual="$props.atual"
          :bloqueado="$props.bloqueado"
          :tipo="!tarefa.tarefa_cronograma_id ? 'tarefa-workflow' : 'tarefa-cronograma'"
          :largo="$props.largo"
          :dados-tarefa="{
            faseMaeId: $props.id,
            inicioReal: tarefa.andamento.inicio_real
          }"
          :concluida="tarefa.andamento.concluida"
        />
      </template>
    </div>
  </article>

  <EdicaoTarefaComCronogramaModal
    ref="edicaoModal"
    v-bind="$props"
  />
</template>

<style lang="less" scoped>
@grupo-minimo: 540px;

.varal-de-fase-item__raiz {
  position: relative;
  width: 100%;
  min-width: 235px;
}

.varal-de-fase-item {
  width: 100%;
  min-width: 235px;
}

.varal-de-fase-item--secundario {
  .varal-de-fase-item__conteudo {
    border: 2px dotted #005C8A;
  }
}

.varal-de-fase-item--atual {
  .varal-de-fase-item__conteudo {
    background-color: #FFF6DF;
    border-color: #F7C234;
  }

  &.varal-de-fase-item--secundario {
    .varal-de-fase-item__conteudo {
      background-color: #FFF6DF;
      border-color: #005C8A;
    }

    .varal-de-fase-item__titulo-situacao {
      background-color: #F7C234;
    }
  }
}

.varal-de-fase-item--bloqueado {
  &, &.varal-de-fase-item--secundario {
    .varal-de-fase-item__conteudo {
      background-color: #F0F0F0;
      border-color: #B8C0CC;
    }
  }

  &.varal-de-fase-item--secundario {
    .varal-de-fase-item__titulo-situacao {
      background-color: #C8C8C8;
    }
  }
}

.varal-de-fase-item__conteudo {
  background-color: #E0F2FF;
  padding: 8px 12px;
  border-radius: 18px;
  border: 1px solid #B8C0CC;
  width: 100%;
  position: relative;
}

.varal-de-fase-item__titulo {
  margin-bottom: 9px;
  font-weight: 600;
  font-size: 1.14rem;
  line-height: 1.14rem;

  display: flex;
  gap: 4px;
  align-items: center;
}

.varal-de-fase-item__titulo:has(.smae-tooltip) {
  gap: 23px;
}

.smae-tooltip {
  color: #F7C234;
}

.varal-de-fase-item__titulo-situacao  {
  display: block;
  min-width: 0.5rem;
  height: 0.5rem;
  background-color: #005C8A;
  border-radius: 999px;
}

.varal-de-fase-item__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-block-end: 1px solid #B8C0CC;

  dt, dd {
    font-size: 1rem;
    margin: 0;
  }

  dt {
    font-weight: 400;
    line-height: 1.43rem;
    color: #595959;
  }

  dd  {
    line-height: 1;
    font-weight: 600;
    color: #333333;
  }

  &:last-of-type {
    border-block-end-width: 0;
  }
}

.varal-de-fase-item__agrupador-botoes {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.varal-de-fase-item:has(.varal-de-fase-item__agrupador-botoes) {
  .varal-de-fase-item__item:last-of-type {
    border-block-end-width: 1px;
  }
}

.varal-de-fase-item__botao {
  text-align: center;
  border-radius: 12px;
  flex-grow: 1;
  color: #FFF;
  background-color: #005C8A;
  border: initial;

  font-size: 1.14rem;
  line-height: 1;
  text-transform: lowercase;
  padding: 4px 0;
  font-weight: 500;
}

.varal-de-fase-item--largo {
  .varal-de-fase-item__titulo {
    font-size: 1.43rem;
    line-height: 1.43rem;
    margin-bottom: 12px;
  }

  .varal-de-fase-item__conteudo {
    padding: 12px 20px;
  }

  .varal-de-fase-item__item {
    gap: 4px;

    &:first-of-type {
      border-block-start: 1px solid #B8C0CC;
    }

    flex-direction: column;
    align-items: flex-start;
    padding: 12px 8px;

    dt, dd {
      line-height: 1.71rem;
    }

    dt {
      font-size: 1.14rem;
    }

    dd {
      font-size: 1.43rem;
      font-weight: 400;
    }
  }

  .varal-de-fase-item__item--duracao {
    flex-direction: row;
    justify-content: space-between;
  }

  .varal-de-fase-item__agrupador-botoes {
    flex-direction: column;
    margin-top: 12px;
  }

  &.varal-de-fase-item--secundario {
    .varal-de-fase-item__agrupador-botoes {
      margin-top: 8px;
    }
  }
}

.varal-de-fase-item__tarefas {
  width: 100%;
  margin-top: 2rem;
}

article:has(+ article), article + article {
  display: flex;
  justify-content: center;
  margin-top: 2rem;

  &::before {
    content: '';
    position: absolute;
    height: calc(100% + 2rem);
    border: 1px dashed #B8C0CC;
    z-index: -1;
    bottom: 0;
  }
}
</style>
