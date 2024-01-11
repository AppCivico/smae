<script setup>
import { acompanhamento as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';
import { useProjetosStore } from '@/stores/projetos.store.ts';

const acompanhamentosStore = useAcompanhamentosStore();
const projetosStore = useProjetosStore();
const riscosStore = useRiscosStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(acompanhamentosStore);

const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina
      :class="{
        'alerta-de-paralisação': emFoco?.cronograma_paralisado,
      }"
      :title="emFoco?.cronograma_paralisado
        ? schema.fields.cronograma_paralisado.spec.label
        : undefined"
    >
      Resumo do acompanhamento
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      v-if="emFoco?.id
        && (!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel)"
      :to="{
        name: 'acompanhamentosEditar', params: {
          acompanhamentoId: emFoco.id,
          projetoId: Number.parseInt($route.params.projetoId, 10) || undefined,
        }
      }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <div
    v-if="emFoco"
    class="boards"
  >
    <div class="flex g2 mb1">
      <div class="f0 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Número
        </dt>
        <dd class="t13">
          {{ emFoco?.ordem || '-' }}
        </dd>
      </div>
      <div class="f0 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_registro.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_registro
            ? dateToField(emFoco?.data_registro)
            : '-' }}
        </dd>
      </div>

      <div class="f2 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.participantes.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.participantes || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.pauta.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.pauta || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.detalhamento.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.detalhamento || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.observacao.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.observacao || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.detalhamento_status.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.detalhamento_status || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.pontos_atencao.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.pontos_atencao || '-' }}
        </dd>
      </div>
    </div>

    <section
      v-if="emFoco?.acompanhamentos?.length"
      class="g2 mb2"
    >
      <h2 class="label mt2 mb2">
        {{ schema.fields.acompanhamentos.spec.label }}
      </h2>

      <div
        v-for="(acompanhamento, idx) in emFoco.acompanhamentos"
        :key="`acompanhamentos--${idx}`"
        class="mb1"
      >
        <div class="flex g2 mb1">
          <div class="f1 mb1 t13">
            <strong>{{ acompanhamento?.numero_identificador }}</strong> -
            {{ acompanhamento?.encaminhamento || '-' }}
          </div>

          <div class="flex flexwrap g2 f1 mb1">
            <div class="f2 mb1">
              <dt class="t12 uc w700 mb05 tamarelo">
                {{ schema.fields.acompanhamentos.innerType.fields.responsavel.spec.label }}
              </dt>

              <dd class="t13">
                {{ acompanhamento?.responsavel || '-' }}
              </dd>
            </div>
            <div class="f1 mb1">
              <dt class="t12 uc w700 mb05 tamarelo">
                {{ schema.fields.acompanhamentos.innerType.fields.prazo_encaminhamento.spec.label }}
              </dt>

              <dd class="t13">
                {{ acompanhamento?.prazo_encaminhamento
                  ? dateToField(acompanhamento?.prazo_encaminhamento)
                  : '-' }}
              </dd>
            </div>
            <div class="f1 mb1">
              <dt class="t12 uc w700 mb05 tamarelo">
                {{ schema.fields.acompanhamentos.innerType.fields.prazo_realizado.spec.label }}
              </dt>

              <dd class="t13">
                {{ acompanhamento?.prazo_realizado
                  ? dateToField(acompanhamento?.prazo_realizado)
                  : '-' }}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </section>

    <dl
      v-if="emFoco?.risco?.length"
      class="g2 mb2"
    >
      <dt class="label mt2 mb1">
        {{ schema.fields.risco.spec.label }}
      </dt>
      <dd
        v-for="(risco, idx) in emFoco.risco"
        :key="`risco--${idx}`"
        class="mb2 mb1 t13"
      >
        {{ riscosStore.riscosPorId[risco.id]?.titulo || '-' }}
      </dd>
    </dl>
  </div>

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
