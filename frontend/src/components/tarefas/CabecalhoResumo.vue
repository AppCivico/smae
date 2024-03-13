<script setup>
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';

import { computed, ref } from 'vue';

const props = defineProps({
  emFoco: {
    type: Object,
    required: true,
  },
});

// eslint-disable-next-line max-len
const nívelMáximoPermitido = computed(() => emFoco?.extra?.portfolio?.nivel_maximo_tarefa || 0);

const nívelMáximoVisível = ref(0);

async function iniciar() {
  emFoco.$reset();
  await emFoco.buscarTudo();

  if (nívelMáximoPermitido.value) {
    nívelMáximoVisível.value = nívelMáximoPermitido.value;
  }
}

iniciar();
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="boards mb4">
    <dl class="flex flexwrap g2">
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Início previsto
        </dt>
        <dd class="t13 dado-estimado">
          {{
            emFoco?.previsao_inicio
              ? dateToField(emFoco.previsao_inicio)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término previsto
        </dt>
        <dd class="t13 dado-estimado">
          {{
            emFoco?.previsao_termino
              ? dateToField(emFoco.previsao_termino)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Início real
        </dt>
        <dd class="t13 dado-efetivo">
          {{
            emFoco?.realizado_inicio
              ? dateToField(emFoco.realizado_inicio)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término real
        </dt>
        <dd class="t13 dado-efetivo">
          {{
            emFoco?.realizado_termino
              ? dateToField(emFoco.realizado_termino)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Duração
        </dt>
        <dd class="t13">
          {{ emFoco?.realizado_duracao
            ? emFoco?.realizado_duracao + ' dias'
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Percentual concluído
        </dt>
        <dd class="t13">
          {{ typeof emFoco?.percentual_concluido === 'number'
            ? emFoco?.percentual_concluido + '%'
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Atraso
        </dt>
        <dd class="t13">
          {{ emFoco?.atraso
            ? emFoco?.atraso + ' dias'
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Custo total planejado
        </dt>
        <dd class="t13 dado-estimado">
          {{ typeof emFoco?.previsao_custo === 'number'
            ? `R$${dinheiro(emFoco?.previsao_custo)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Custo real
        </dt>
        <dd class="t13 dado-efetivo">
          {{ typeof emFoco?.realizado_custo === 'number'
            ? `R$${dinheiro(emFoco?.realizado_custo)}`
            : '-' }}
        </dd>
      </div>
    </dl>
  </div>
</template>
