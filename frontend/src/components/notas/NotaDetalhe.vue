<script setup>
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { storeToRefs } from 'pinia';

const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo } = storeToRefs(tipoStore);

const blocoStore = useBlocoDeNotasStore();
const { emFoco } = storeToRefs(blocoStore);

const props = defineProps({
  notaId: {
    type: String,
    default: '',
  },
});

if (props.notaId) {
  blocoStore.buscarItem(props.notaId);
}

if (listaTipo.value.length === 0) {
  tipoStore.buscarTudo();
}

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Nota</h1>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="emFoco?.id_jwt && emFoco?.pode_editar"
      :to="{ name: 'notasEditar', params: { notaId: emFoco?.id_jwt } }"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>
  <div
    class="mb1"
    v-html="emFoco?.nota"
  />
  <div class="flex spacebetween center">
    <h3>Detalhes</h3>
    <hr class="ml2 f1">
  </div>
  <dl class="flex mb2 flexwrap g2">
    <div class="f1">
      <dt>Data</dt>
      <dd>{{ new Date(emFoco?.data_nota).toLocaleDateString("pt-BR") }}</dd>
    </div>
    <div class="f1">
      <dt>Rever em</dt>
      <dd>
        {{
          emFoco?.rever_em
            ? new Date(emFoco?.rever_em).toLocaleDateString("pt-BR")
            : " - "
        }}
      </dd>
    </div>
    <div class="f1">
      <dt>Data de ordenacao</dt>
      <dd>
        {{
          emFoco?.data_ordenacao
            ? new Date(emFoco?.data_ordenacao).toLocaleDateString("pt-BR")
            : " - "
        }}
      </dd>
    </div>
    <div class="f1">
      <dt>Órgão responsável</dt>
      <dd>{{ emFoco?.orgao_responsavel?.sigla }}</dd>
    </div>
    <div class="f1">
      <dt>Pessoa responsável</dt>
      <dd>{{ emFoco?.pessoa_responsavel?.nome_exibicao }}</dd>
    </div>
    <div class="f1">
      <dt>Status</dt>
      <dd>{{ emFoco?.status.replace(/_/g, " ") }}</dd>
    </div>
    <div class="f1">
      <dt>Dispara e-mail</dt>
      <dd>{{ emFoco?.dispara_email ? "Sim" : "Não" }}</dd>
    </div>
    <div class="f1">
      <dt>Tipo</dt>
      <dd>
        {{ listaTipo?.find((tipo) => tipo.id === emFoco?.tipo_nota_id)?.codigo }}
      </dd>
    </div>
    <div class="enderecamento">
      <dt>Endereçamentos</dt>
      <div v-if="emFoco?.enderecamentos.length > 0">
        <div
          v-for="enderecamento in emFoco.enderecamentos"
          :key="enderecamento.id"
          class="flex"
        >
          <dd class="orgao">
            {{ enderecamento?.orgao_enderecado.sigla }}
          </dd>
          <dd>
            &nbsp;{{ " - " + enderecamento?.pessoa_enderecado?.nome_exibicao }}
          </dd>
        </div>
      </div>
      <div v-else>
        -
      </div>
    </div>
  </dl>
</template>
<style scoped>
h3 {
  font-weight: 600;
}
dl div {
  min-width: 300px;
  max-width: 300px;
}

dl div dt {
  color: #607a9f;
  font-weight: 600;
}
.orgao {
  font-weight: 600;
  margin-bottom: 5px;
}

.enderecamento {
  min-width: 600px;
}
</style>
