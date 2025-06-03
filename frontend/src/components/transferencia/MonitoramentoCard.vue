<script setup>
import { computed } from 'vue';
import dinheiro from '@/helpers/dinheiro';
import { dateToShortDate } from '@/helpers/dateToDate';

const props = defineProps({
  recurso: {
    type: Object,
    required: true,
  },
});

const status = computed(() => props.recurso.historico_status[0].status_customizado?.tipo || '');
</script>
<template>
  <article
    class="card-monitoramento"
    :class="{
      'card-monitoramento--finalizada': status === 'Finalizado',
      'card-monitoramento--em-curso': status === 'EmAndamento',
    }"
  >
    <dl>
      <div class="card-monitoramento__dl-group">
        <dt class="t13 w300">
          Órgão
        </dt>
        <dd class="t20 w400">
          {{ recurso.orgao_gestor.sigla }}
        </dd>
      </div>

      <template v-if="recurso.historico_status[0].nome_responsavel">
        <div class="card-monitoramento__dl-group">
          <dt class="t13 w300">
            Responsável
          </dt>
          <dd class="t20 w400">
            {{ recurso.historico_status[0].nome_responsavel }}
          </dd>
        </div>
      </template>

      <div class="card-monitoramento__dl-group">
        <dt class="t13 w300">
          Nome
        </dt>
        <dd class="t20 w400 card-monitoramento__item-com-marcador">
          {{ recurso.nome }}
        </dd>
      </div>

      <div class="card-monitoramento__dl-group">
        <dt class="t13 w300">
          Valor do repasse
        </dt>
        <dd class="t20 w400">
          R$ {{ dinheiro(recurso.valor_total) }}
        </dd>
      </div>

      <div class="card-monitoramento__dl-group">
        <dt class="t13 w300">
          Data
        </dt>
        <dd class="t20 w400">
          {{ dateToShortDate(recurso.historico_status[0].data_troca) }}
        </dd>
      </div>

      <div class="card-monitoramento__dl-group">
        <dt class="t13 w300">
          Status
        </dt>
        <dd class="t20 w400">
          {{ recurso.status_atual }}
        </dd>
      </div>

      <template v-if="recurso.historico_status[0].motivo">
        <div class="card-monitoramento__dl-group">
          <dt class="t13 w300">
            Data
          </dt>
          <dd class="t20 w400">
            {{ recurso.historico_status[0].motivo }}
          </dd>
        </div>
      </template>
    </dl>
  </article>
</template>
<style scoped>
.card-monitoramento {
  --cor-de-tema: #ee3b2b;

  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 150px;
  padding: 2rem 1.5rem;
  border-radius: 30px 5px 30px 5px;
  background-color: #fafafa;
  border: 1px solid #ddd;
  box-shadow: 2px 3px 10px 0 rgba(0,0,0,0.2);

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: 37%;
    right: 7%;
    height: 8px;
    border-radius: 2px;
    background-color: var(--cor-de-tema);
    box-shadow: 0 2px 3px -1px rgba(0,0,0,0.2);
  }

  &::after {
    top: auto;
    bottom: -4px;
    left: 7%;
    right: 37%;
  }
}

.card-monitoramento--finalizada {
  --cor-de-tema: #7a7a7a;
}

.card-monitoramento--em-curso {
  --cor-de-tema: #ffda00;
}

.card-monitoramento__dl-group {
  --dl-margin-like-space: 0.8rem;

  display: grid;
  gap: 0.3rem;
  border-block-end: 1px solid #d9d9d9;
  padding-block-end: var(--dl-margin-like-space);
  margin-block-end: var(--dl-margin-like-space);
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
