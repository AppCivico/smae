<script lang="ts" setup>
import useTamanhoDispositivo from '@/hooks/useTamanhoDispositivo';

export type VaralDeItemProps = {
  titulo: string,
  duracao?: number,
  responsavel: string,
  situacao: string,
  tarefas?: any[]
  pendente?: boolean
};

type Props = VaralDeItemProps & {
  secundario?: boolean
};

const { web } = useTamanhoDispositivo();

defineProps<Props>();

</script>

<template>
  <article :class="{'varal-de-fase-item__raiz container-inline': true}">
    <!-- atual == true -->
    <section
      :class="[
        ,
        'varal-de-fase-item',
        { 'varal-de-fase-item--pendente': $props.pendente },
        { 'varal-de-fase-item--secundario': $props.secundario },
      ]"
    >
      <dt
        v-if="!web && !$props.secundario"
        class="varal-de-fase-item__titulo"
      >
        {{ $props.titulo }}
      </dt>

      <div class="varal-de-fase-item__conteudo">
        <dt
          v-if="web || $props.secundario"
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
              v-if="$props.duracao"
              class="varal-de-fase-item__item varal-de-fase-item__item--duracao"
            >
              <dt>Duração</dt>
              <dd>{{ $props.duracao }}d</dd>
            </div>

            <div class="varal-de-fase-item__item">
              <dt>Responsável</dt>
              <dd>{{ $props.responsavel }}</dd>
            </div>

            <div class="varal-de-fase-item__item">
              <dt>Situação</dt>
              <dd>{{ $props.situacao }}</dd>
            </div>
          </dl>
        </dd>

        <div>
          <button v-if="$props.tarefas?.length">
            {{ 1 }}/ {{ $props.tarefas?.length }}
          </button>

          <!-- fase => concluida === false -->
          <!-- tarefa => concluida === false -->
          <button class="btn">
            Editar
          </button>
        </div>
      </div>
    </section>

    <!-- <div
      v-if="$props.tarefas?.length"
      class="varal-de-fase-item__tarefas"
    >
      <VaralDeFaseItem
        v-for="(tarefa, tarefaIndex) in [
          ...$props.tarefas,
          ...$props.tarefas,
        ]"
        :key="`fase--${tarefaIndex}`"
        class="varal-de-fase-item__tarefa-item"
        secundario
        :titulo="tarefa.workflow_tarefa?.descricao"
        :duracao="tarefa.duracao"
        :situacao="tarefa.tipo_situacao || '-'"
        :responsavel="tarefa.andamento.orgao_responsavel || '-'"
        :pendente="!tarefa.andamento.concluida"
      />
    </div> -->
  </article>
</template>

<style lang="less" scoped>
@import "@/_less/tamanho-dispostivo.less";

@card-minimo: 235px;

.varal-de-fase-item__raiz {
  width: 100%;
  min-width: @card-minimo;

}

.varal-de-fase-item {
  // width: 100%;
  // min-width: @card-minimo;
}

.varal-de-fase-item--secundario {
  .varal-de-fase-item__conteudo {
    border: 2px dashed #005C8A;
  }
}

.varal-de-fase-item--pendente {
  .varal-de-fase-item__conteudo {
    background-color: #FFF6DF;
    border-color: #F7C234;
  }

  &.varal-de-fase-item--secundario {
    .varal-de-fase-item__conteudo {
      background-color: #fff;
      border-color: #005C8A;
    }

    .varal-de-fase-item__titulo-situacao {
      background-color: #F7C234;
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
}

.varal-de-fase-item__titulo-situacao  {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #005C8A;
  border-radius: 999px;
}

// .varal-de-fase-item__conteudo:not(:has(.varal-de-fase-item__titulo)) {
//   .varal-de-fase-item__item:first-of-type {
//     border-block-start: initial;
//   }
// }

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
}

@container (width <= @card-minimo) {
  .varal-de-fase-item__titulo {
    background-color: #005C8A;
    margin-bottom: 12px;
    font-weight: 1.43rem;
    line-height: 1.43rem;
  }

  .varal-de-fase-item__item {
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
}

.varal-de-fase-item__tarefas {
  width: 100%;
  margin-top: 2rem;
}

.varal-de-fase-item__tarefa-item {
  position: relative;
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
}</style>
