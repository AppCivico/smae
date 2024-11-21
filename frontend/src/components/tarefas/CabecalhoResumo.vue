<script setup>
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  emFoco: {
    type: Object,
    required: true,
  },
  existeEmail: {
    type: Boolean,
    default: false,
  },
  emailAtivo: {
    type: Boolean,
    default: false,
  },
});

const emFocoFiltrado = computed(() => props.emFoco.tarefa_cronograma || props.emFoco);

</script>
<template>
  <div class="boards mb2">
    <dl class="flex flexwrap g2">
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Início Planejado
        </dt>
        <dd class="t13 dado-estimado">
          {{
            emFocoFiltrado?.previsao_inicio
              ? dateToField(emFocoFiltrado.previsao_inicio)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término Planejado
        </dt>
        <dd class="t13 dado-estimado">
          {{
            emFocoFiltrado?.previsao_termino
              ? dateToField(emFocoFiltrado.previsao_termino)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Real Início
        </dt>
        <dd class="t13 dado-efetivo">
          {{
            emFocoFiltrado?.realizado_inicio
              ? dateToField(emFocoFiltrado.realizado_inicio)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Real Término
        </dt>
        <dd class="t13 dado-efetivo">
          {{
            emFocoFiltrado?.realizado_termino
              ? dateToField(emFocoFiltrado.realizado_termino)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término Projetado
        </dt>
        <dd class="t13 dado-estimado">
          {{
            emFocoFiltrado?.projecao_termino
              ? dateToField(emFocoFiltrado.projecao_termino)
              : '--/--/----'
          }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Duração
        </dt>
        <dd class="t13">
          {{ emFocoFiltrado?.realizado_duracao
            ? emFocoFiltrado?.realizado_duracao + ' dias'
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Percentual concluído
        </dt>
        <dd class="t13">
          {{ typeof emFocoFiltrado?.percentual_concluido === 'number'
            ? emFocoFiltrado.percentual_concluido + '%'
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Atraso
        </dt>
        <dd class="t13">
          {{ emFocoFiltrado?.atraso
            ? emFocoFiltrado?.atraso + ' dias'
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Custo total planejado
        </dt>
        <dd class="t13 dado-estimado">
          {{ typeof emFocoFiltrado?.previsao_custo === 'number'
            ? `R$${dinheiro(emFocoFiltrado?.previsao_custo)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Custo real
        </dt>
        <dd class="t13 dado-efetivo">
          {{ typeof emFocoFiltrado?.realizado_custo === 'number'
            ? `R$${dinheiro(emFocoFiltrado.realizado_custo)}`
            : '-' }}
        </dd>
      </div>
      <div
        v-if="route.meta.entidadeMãe === 'TransferenciasVoluntarias'"
        class="f1 mb1"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          Envio de e-mail?
        </dt>
        <dd class="t13 dado-efetivo">
          <div
            v-if="emailAtivo"
            class="flex g1"
          >
            <span>Sim</span>
            <router-link
              :to="{ name: 'transferenciaEmailModal' }"
              title="Editar e-mail"
            >
              <svg
                width="18"
                height="17"
              ><use xlink:href="#i_edit" /></svg>
            </router-link>
          </div>
          <span v-else>Não</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
