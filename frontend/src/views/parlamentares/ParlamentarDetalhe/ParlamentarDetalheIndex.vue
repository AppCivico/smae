<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';

import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import SmaeLink from '@/components/SmaeLink.vue';
import TituloDePagina from '@/components/TituloDaPagina.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import dateToDate from '@/helpers/dateToDate';
import { useAuthStore } from '@/stores/auth.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';

import PainelCartao from './components/PainelCartao.vue';
import ParlamentarDetalheBiografia from './partials/ParlamentarDetalheBiografia.vue';
import ParlamentarDetalhePainel from './partials/ParlamentarDetalhePainel.vue';

const props = defineProps<{
  parlamentarId: number;
}>();

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const authStore = useAuthStore();
const parlamentaresStore = useParlamentaresStore();
const { emFoco } = storeToRefs(parlamentaresStore);

const podeVerPainel = computed(() => authStore.temPermissãoPara('CadastroParlamentar.painel'));
const podeEditar = computed(() => authStore.temPermissãoPara('CadastroParlamentar.editar'));

const aniversario = computed(() => dateToDate(emFoco.value?.nascimento, {
  day: '2-digit',
  month: '2-digit',
}));

const cargo = computed(() => {
  const valor = emFoco.value?.ultimo_mandato?.cargo as keyof typeof cargosDeParlamentar | undefined;

  return valor ? (cargosDeParlamentar[valor]?.nome || valor) : '';
});

watch(() => props.parlamentarId, (id) => {
  parlamentaresStore.buscarItem(id);
}, { immediate: true });
</script>

<template>
  <TituloDePagina class="resumo-do-parlamentar__titulo">
    Resumo
  </TituloDePagina>

  <div class="resumo-do-parlamentar__cabecalho">
    <div class="resumo-do-parlamentar__perfil">
      <div class="resumo-do-parlamentar__foto">
        <img
          v-if="emFoco?.foto"
          :src="`${baseUrl}/download/${emFoco.foto}?inline=true`"
          :alt="emFoco.nome_popular || emFoco.nome"
        >
      </div>

      <p
        v-if="podeEditar && emFoco?.id"
        class="resumo-do-parlamentar__editar"
      >
        <SmaeLink :to="{ name: 'parlamentaresEditar', params: { parlamentarId: emFoco.id } }">
          <svg
            width="20"
            height="20"
            aria-hidden="true"
          ><use xlink:href="#i_edit" /></svg>
          Editar perfil
        </SmaeLink>
      </p>
    </div>

    <PainelCartao
      class="resumo-do-parlamentar__dados"
      titulo="Dados do Parlamentar"
      sem-fundo
    >
      <dl class="resumo-do-parlamentar__lista">
        <div>
          <dt>Nome</dt>
          <dd>{{ emFoco?.nome_popular || '—' }}</dd>
        </div>
        <div>
          <dt>Nome Civil</dt>
          <dd>{{ emFoco?.nome || '—' }}</dd>
        </div>
        <div>
          <dt>Aniversário</dt>
          <dd>{{ aniversario || '—' }}</dd>
        </div>
        <div>
          <dt>Cargo</dt>
          <dd>{{ cargo || '—' }}</dd>
        </div>
      </dl>
    </PainelCartao>
  </div>

  <EnvelopeDeAbas
    class="resumo-do-parlamentar__abas"
    :atributos-de-cada-aba="{ painel: { hidden: !podeVerPainel } }"
  >
    <template #painel__cabecalho>
      Painel
    </template>
    <template #painel="{ estáAberta }">
      <ParlamentarDetalhePainel
        v-if="podeVerPainel && estáAberta"
        :parlamentar-id="parlamentarId"
      />
    </template>

    <template #biografia__cabecalho>
      Biografia
    </template>
    <template #biografia>
      <ParlamentarDetalheBiografia :exibir-edicao="podeEditar" />
    </template>
  </EnvelopeDeAbas>
</template>

<style scoped lang="less">
.resumo-do-parlamentar__titulo {
  margin-bottom: 3.4rem;
}

.resumo-do-parlamentar__cabecalho {
  display: flex;
  align-items: flex-start;
  gap: 9.1rem;
  max-width: 85.7rem;
  margin-bottom: 5.1rem;
}

.resumo-do-parlamentar__perfil {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  flex-shrink: 0;
}

.resumo-do-parlamentar__foto {
  width: 19.9rem;
  height: 20.6rem;
  overflow: hidden;
  border: 0.4rem solid @amarelo;
  border-radius: 0.7rem;
  background-color: @c50;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.resumo-do-parlamentar__editar {
  margin: 0;

  :deep(a) {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    font-weight: 900;
    line-height: 1.5rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: @c600;
  }
}

.resumo-do-parlamentar__dados {
  flex-grow: 1;
  max-width: 56.6rem;
  min-height: 15.1rem;
  margin-top: 0.4rem;
}

.resumo-do-parlamentar__lista {
  display: grid;
  grid-template-columns: 17.7rem 1fr;
  gap: 1.1rem 0;
  margin: 1.2rem 0 0;

  dt {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.3;
    color: @amarelo;
  }

  dd {
    margin: 0.3rem 0 0;
    font-size: 1.1rem;
    line-height: 1.3;
    color: #233b5c;
  }
}

.resumo-do-parlamentar__abas {
  :deep(.abas__navegacao) {
    margin-bottom: 4rem;
  }

  :deep(.abas__lista > li) {
    padding-top: 0.6rem;
    padding-bottom: 0.6rem;
    padding-right: 2.7rem;
  }

  :deep(.abas__lista > li:not([hidden]) ~ li) {
    padding-left: 2.7rem;
    border-left: 0.1rem solid @c400;
  }

  :deep(.abas__link) {
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.7rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: @c600;
  }

  :deep(.abas-lista__item--aberta .abas__link) {
    color: @amarelo;
  }
}
</style>
