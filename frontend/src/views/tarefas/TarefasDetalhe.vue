<template>
  <div>
    <h1 class="mt1 mb1">
      Resumo Atividade
    </h1>
    <div class="flex spacebetween">
      <dl>
        <dt class="tc500 w700">
          Tarefa
        </dt>
        <dd> {{ emFoco?.tarefa }}</dd>
      </dl>
      <dl>
        <dt class="tc500 w700">
          Marco do projeto?
        </dt>
        <dd> {{ emFoco?.eh_marco }}</dd>
      </dl>
    </div>
    <div class="flex spacebetween">
      <dl>
        <dt class="tc500 w700">
          Tarefa-mãe
        </dt>
        <dd> emFoco.tarefa_pai_id: {{ emFoco?.tarefa_pai_id }}</dd>
      </dl>
      <dl>
        <dt class="tc500 w700">
          Ordem
        </dt>
        <dd>
          <strong>Pego de onde?</strong>
        </dd>
      </dl>
      <dl>
        <dt class="tc500 w700">
          Orgão responsável
        </dt>
        <dd>
          <strong>Pego de onde?</strong>
        </dd>
      </dl>
    </div>
    <dl>
      <dt class="tc500 w700">
        Responsável pela atividade
      </dt>
      <dd> {{ emFoco?.projeto?.responsavel?.nome_exibicao }}</dd>
    </dl>
    <dl>
      <dt class="tc500 w700">
        Descrição
      </dt>
      <dd> {{ emFoco?.descricao }}</dd>
    </dl>
    <div>
      emFoco: <pre>{{ emFoco }}</pre>
    </div>
  </div>
</template>
<script setup>
import { storeToRefs } from 'pinia';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const tarefasStore = useTarefasStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(tarefasStore);

</script>

<style>

</style>
