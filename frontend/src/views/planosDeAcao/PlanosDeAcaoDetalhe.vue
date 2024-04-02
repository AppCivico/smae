<script setup>
import { storeToRefs } from 'pinia';
import { defineProps, ref } from 'vue';
import dinheiro from '@/helpers/dinheiro';
import { planoDeAção as schema } from '@/consts/formSchemas';
import { usePlanosDeAçãoStore } from '@/stores/planosDeAcao.store.ts';
import dateToField from '@/helpers/dateToField';
import requestS from '@/helpers/requestS.ts';

const planosDeAçãoStore = usePlanosDeAçãoStore();
const {  emFoco } = storeToRefs(planosDeAçãoStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const u = ref(null);

async function iniciar(id) {
  u.value = await requestS.get(
    `${baseUrl}/projeto/${props.projetoId}/plano-acao-monitoramento`,
    {
      plano_acao_id: id,
    },
  );
}

iniciar()

</script>

<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>Resumo do plano de ação</TítuloDePágina>
    <hr class="ml2 f1">
    <router-link class="btn big ml2" title="Editar plano de ação" :to="{ name: 'planosDeAçãoEditar' }">Editar
    </router-link>
  </div>

  <div v-if="emFoco" class="boards">
    <h2 class="label mt2 mb2">RESPONSÁVEL</h2>
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.contramedida.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.contramedida || '-' }}
        </dd>
      </div>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Órgão
        </dt>
        <dd class="t13">
          {{ emFoco?.orgao.sigla || '-' }}
        </dd>
      </div>

      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.responsavel.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.responsavel || '-' }}
        </dd>
      </div>

      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.contato_do_responsavel.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.contato_do_responsavel || '-' }}
        </dd>
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.prazo_contramedida.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.prazo_contramedida
          ? dateToField(emFoco?.prazo_contramedida)
          : '-'
          }}
        </dd>
      </div>

      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.data_termino.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.data_termino
          ? dateToField(emFoco?.data_termino)
          : '-'
          }}
        </dd>
      </div>

      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.custo.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.custo
            ? `R$${dinheiro(emFoco?.custo)}`
            : '-'
          }}
        </dd>
      </div>

      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields.custo_percentual.spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.custo_percentual || '-' }}
        </dd>
      </div>
    </div>
  </div>

  <div class="f1 mb1">
    <dt class="t12 uc w700 mb05 tamarelo">
      {{ schema.fields.medidas_de_contingencia.spec.label }}
    </dt>
    <dd class="t13">
      <p>{{ emFoco?.medidas_de_contingencia || '-' }}</p>
    </dd>
  </div>

  <div>
    <table v-if="u && u.linhas && u.linhas.length > 0" class="tablemain">
      <colgroup>
        <col class="col--data">
        <col>
      </colgroup>
      <tr v-for="(linha, index) in u.linhas" :key="index">
        <td>{{ dateToField(linha.data_afericao) || "-" }}</td>
        <td>{{ linha.descricao }}</td>
      </tr>
    </table>
    <span v-else class="spinner">Carregando</span>
  </div>

</template>
