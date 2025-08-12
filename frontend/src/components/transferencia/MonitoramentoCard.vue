<script setup>
import { computed } from 'vue';
import dinheiro from '@/helpers/dinheiro';
import { dateToShortDate } from '@/helpers/dateToDate';
import combinadorDeListas from '@/helpers/combinadorDeListas';

const props = defineProps({
  recurso: {
    type: Object,
    required: true,
  },
});

const status = computed(() => {
  const historicoStatus = props.recurso.historico_status;
  if (!historicoStatus || historicoStatus.length === 0) return '';

  return historicoStatus[0].status_customizado?.tipo
    || historicoStatus[0].status_base?.tipo
    || '';
});

const statusFinalizada = new Set(['ConcluidoComSucesso', 'EncerradoSemSucesso']);
const statusCancelada = new Set(['Terminal', 'Cancelada']);

const classeDoStatus = computed(() => {
  if (statusFinalizada.has(status.value)) return 'card-monitoramento--finalizada';
  if (statusCancelada.has(status.value)) return 'card-monitoramento--cancelada';
  return 'card-monitoramento--em-curso';
});

const recursoItem = computed(() => {
  const { recurso } = props;

  const columns = [
    { label: 'Órgão', valor: recurso.orgao_gestor.sigla },
    { label: 'Nome', valor: recurso.nome },
    { label: 'Valor do repasse', valor: `R$ ${dinheiro(recurso.valor_total)}` },
  ];

  if (
    recurso.historico_status.length > 0
    && recurso.historico_status[0].nome_responsavel
  ) {
    columns.push({ label: 'Responsável', valor: recurso.historico_status[0].nome_responsavel });
  }

  if (recurso.parlamentares.length) {
    columns.push({ label: 'Parlamentar(es)', valor: combinadorDeListas(recurso.parlamentares, ', ', 'parlamentar.nome') });
  }

  columns.push({
    class: 'card-monitoramento__dl-group--status',
    label: 'Status - Em',
    valor: `${recurso.status_atual}\n- ${dateToShortDate(recurso.historico_status?.[0]?.data_troca) || ''}`,
  });

  if (recurso.historico_status.length > 0) {
    columns.push({
      label: 'Motivo',
      valor: recurso.historico_status[0].motivo,
    });
  }

  return columns;
});

</script>
<template>
  <article
    class="card-monitoramento"
    :class="classeDoStatus"
  >
    <dl class="card-monitoramento__lista">
      <div
        v-for="(item, itemIndex) in recursoItem"
        :key="`card-monitoramento--${itemIndex}`"
        class="card-monitoramento__dl-group"
        :class="item.class"
      >
        <dt class="t13 w300">
          {{ item.label }}
        </dt>
        <dd class="t3 w300">
          {{ item.valor }}
        </dd>
      </div>
    </dl>
  </article>
</template>
<style scoped>
.card-monitoramento {
  container-type: inline-size;

  --cor-de-tema: #ffda00;

  position: relative;
  padding: 2rem 1.5rem;
  border-radius: 30px 5px 30px 5px;
  background-color: #fafafa;
  border: 1px solid #ddd;
  box-shadow: 2px 3px 10px 0 rgba(0,0,0,0.2);

  &::before,
  &::after {
    content: '';
    position: absolute;

    width: 20%;
    height: 8px;
    border-radius: 2px;
    background-color: var(--cor-de-tema);
    box-shadow: 0 2px 3px -1px rgba(0,0,0,0.2);
  }

  &::before {
    top: -4px;
    right: 5%;
  }

  &::after {
    bottom: -4px;
    left: 4%;
  }
}

.card-monitoramento__lista {
  display: flex;
  flex-direction: column;

  @container (width > 900px) {
    flex-direction: row;
  }
}

.card-monitoramento--finalizada {
  --cor-de-tema: #00b300;
}

.card-monitoramento--em-curso {
  --cor-de-tema: #ffda00;
}

.card-monitoramento--cancelada {
  --cor-de-tema: #ee3b2b;
}

.card-monitoramento--cancelada .card-monitoramento__dl-group--status dd {
  background-color: #EE3B2B80;
}

.card-monitoramento__dl-group {
  --dl-margin-like-space: 0.8rem;

  border-bottom: 1px solid #d9d9d9;
  padding-bottom: var(--dl-margin-like-space);
  margin-bottom: var(--dl-margin-like-space);

  &:last-child {
    margin-bottom: initial;
    padding-bottom: initial;
    border-bottom: initial;
  }

  @container (width > 900px) {
    min-width: 0;
    max-width: 230px;

    border-bottom: initial;
    padding-bottom: initial;
    margin-bottom: initial;

    border-right: 1px solid #d9d9d9;
    padding-right: var(--dl-margin-like-space);
    margin-right: var(--dl-margin-like-space);

    &:last-child {
      margin-right: initial;
      padding-right: initial;
      border-right: initial;
    }
  }
}

.card-monitoramento__item-com-marcador {
  display: flex;

  &::before {
    content: '';
    display: inline-flex;
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    translate: 0 calc(0.5em - 3px);
    font-size: 1em;
    line-height: inherit;
    border-radius: 100%;
    margin-inline-end: 0.5rem;
    background-color: var(--cor-de-tema);
  }
}
</style>
