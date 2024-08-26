<template>
  <div>
    <h1 class="mt1 mb1">
      Resumo Atividade
    </h1>
    <div class="flex maxw g2 mb1">
      <dl>
        <dt class="tc500 w700 t16 mb025">
          Tarefa
        </dt>
        <dd> {{ emFoco?.tarefa || ' - ' }}</dd>
      </dl>
      <dl class="ml3">
        <dt class="tc500 w700 t16 mb025">
          Marco do projeto?
        </dt>
        <dd> {{ emFoco?.eh_marco || ' - ' }}</dd>
      </dl>
    </div>
    <div class="flex spacebetween maxw mb1">
      <dl>
        <dt class="tc500 w700 t16 mb025">
          Tarefa-mãe
        </dt>
        <dd>{{ tarefasPorId[emFoco?.tarefa_pai_id]?.tarefa || ' - ' }}</dd>
      </dl>
      <dl>
        <dt class="tc500 w700 t16 mb025">
          Ordem
        </dt>
        <dd> {{ emFoco?.numero || ' - ' }}</dd>
      </dl>
      <dl>
        <dt class="tc500 w700 t16 mb025">
          Orgão responsável
        </dt>
        <dd> {{ emFoco?.orgao?.descricao || ' - ' }}</dd>
      </dl>
    </div>
    <dl class="mb1">
      <dt class="tc500 w700 t16 mb025">
        Responsável pela atividade
      </dt>
      <dd> {{ emFoco?.projeto?.responsavel?.nome_exibicao || ' - ' }}</dd>
    </dl>
    <dl>
      <dt class="tc500 w700 t16 mb025 ">
        Descrição
      </dt>
      <dd> {{ emFoco?.descricao || ' - ' }}</dd>
    </dl>
    <dl>
      <div class="flex spacebetween center mt2 mb2">
        <dt class="tc300 t16">
          Dependências
        </dt>
        <hr class="ml2 f1">
      </div>
      <dd>
        <table class="tablemain wrap">
          <thead>
            <tr>
              <td class="tc300 w700 t12">
                TAREFA RELACIONADA
              </td>
              <td class="tc300 w700 t12">
                TIPO DE RELAÇÃO
              </td>
              <td class="tc300 w700 t12">
                DIAS DE LATÊNCIA
              </td>
            </tr>
          </thead>
          <tbody>
            <td>
              <strong>Pego de onde?</strong>
            </td>
            <td>
              <strong>Pego de onde?</strong>
            </td>
            <td>
              <strong>Pego de onde?</strong>
            </td>
          </tbody>
        </table>
      </dd>
      <hr class="mt3 mb3">
    </dl>
    <div class="maxw">
      <div class="flex spacebetween mb1">
        <dl>
          <dt class="tc500 w700 t16">
            Previsão de início
          </dt>
          <dd> {{ dateToDate(emFoco?.inicio_planejado) || ' - ' }}</dd>
        </dl>
        <dl>
          <dt class="tc500 w700 t16">
            Duração prevista
          </dt>
          <dd>{{ emFoco?.duracao_planejado ? `${emFoco.duracao_planejado} dias` : ' - ' }}</dd>
        </dl>
        <dl>
          <dt class="tc500 w700 t16">
            Previsão de término
          </dt>
          <dd> {{ dateToDate(emFoco?.termino_planejado) || ' - ' }}</dd>
        </dl>
      </div>
      <div class="flex">
        <dl>
          <dt class="tc500 w700 t16">
            Atraso
          </dt>
          <dd>{{ emFoco?.atraso ? `${emFoco.atraso} dias` : ' - ' }}</dd>
        </dl>
        <dl class="ml3">
          <dt class="tc500 w700 t16">
            Previsão de custo
          </dt>
          <dd>{{ emFoco?.custo_estimado ? `R$${emFoco.custo_estimado}` : ' - ' }}</dd>
        </dl>
      </div>
    </div>

    <dl class="mt1 mb1">
      <div class="flex spacebetween center mt2 mb2">
        <dt class="tc300 t16">
          Execução da atividade
        </dt>
        <hr class="ml2 f1">
      </div>
      <div class="flex spacebetween maxw mb1">
        <dl>
          <dt class="tc500 w700 t16">
            Data de início real
          </dt>
          <dd>{{ dateToDate(emFoco?.inicio_real) || ' - ' }}</dd>
        </dl>
        <dl>
          <dt class="tc500 w700 t16">
            Duração real
          </dt>
          <dd>{{ emFoco?.duracao_real ? `${emFoco.duracao_real} dias` : ' - ' }}</dd>
        </dl>
        <dl>
          <dt class="tc500 w700 t16">
            Data de término real
          </dt>
          <dd>{{ dateToDate(emFoco?.termino_real) || ' - ' }}</dd>
        </dl>
      </div>
      <div class="flex">
        <dl>
          <dt class="tc500 w700 t16">
            Custo real
          </dt>
          <dd>{{ emFoco?.real ? `R$${emFoco.real}` : ' - ' }}</dd>
        </dl>
        <dl class="ml3">
          <dt class="tc500 w700 t16">
            Percentual concluído
          </dt>
          <dd>{{ emFoco?.percentual_concluido ? `${emFoco.percentual_concluido}%` : ' - ' }}</dd>
        </dl>
      </div>
    </dl>
    <!-- tarefasPorId: <pre>{{ tarefasPorId }}</pre>
    <div class="mt4">
      emFoco: <pre>{{ emFoco }}</pre>
    </div> -->
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import dateToDate from '@/helpers/dateToDate';

const tarefasStore = useTarefasStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
  tarefasPorId,
} = storeToRefs(tarefasStore);

tarefasStore.buscarTudo();

</script>

<style>
.maxw{
  max-width: 900px;
}
</style>
