<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';

import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import SmaeLink from '@/components/SmaeLink.vue';
import TituloDePagina from '@/components/TituloDaPagina.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import { useAuthStore } from '@/stores/auth.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';

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

const aniversario = computed(() => (emFoco.value?.nascimento
  ? emFoco.value.nascimento.slice(0, 10).split('-').reverse().slice(0, 2)
    .join('/')
  : ''));

const cargo = computed(() => {
  const valor = emFoco.value?.ultimo_mandato?.cargo as keyof typeof cargosDeParlamentar | undefined;

  return valor ? cargosDeParlamentar[valor]?.nome || valor : '';
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

    <section class="resumo-do-parlamentar__dados">
      <header class="resumo-do-parlamentar__dados-cabecalho">
        <h2 class="resumo-do-parlamentar__dados-titulo">
          Dados do Parlamentar
        </h2>
        <hr class="resumo-do-parlamentar__linha">
      </header>

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
    </section>
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
  margin-bottom: 48px;
}

.resumo-do-parlamentar__cabecalho {
  display: flex;
  align-items: flex-start;
  gap: 128px;
  max-width: 1200px;
  margin-bottom: 72px;
}

.resumo-do-parlamentar__perfil {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 17px;
  flex-shrink: 0;
}

.resumo-do-parlamentar__foto {
  width: 279px;
  height: 288px;
  overflow: hidden;
  border: 6px solid @amarelo;
  border-radius: 10px;
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
    gap: 8px;
    font-size: 12px;
    font-weight: 900;
    line-height: 21px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: @c600;
  }
}

.resumo-do-parlamentar__dados {
  flex-grow: 1;
  max-width: 792px;
  min-height: 212px;
  margin-top: 5px;
  padding: 16px 30px 24px 32px;
  border-radius: 12px;
  background-color: @branco;
  box-shadow: 0 9.66px 19.32px 0 fade(@primary, 10%);
}

.resumo-do-parlamentar__dados-cabecalho {
  display: flex;
  align-items: center;
  gap: 27px;
  margin-bottom: 17px;
}

.resumo-do-parlamentar__dados-titulo {
  margin: 0;
  font-size: 25px;
  font-weight: 600;
  line-height: 28px;
  white-space: nowrap;
  color: @c400;
}

.resumo-do-parlamentar__linha {
  flex-grow: 1;
  margin: 0;
  border: 0;
  border-top: 0.94px solid @c500;
}

.resumo-do-parlamentar__lista {
  display: grid;
  grid-template-columns: 248px 1fr;
  gap: 16px 0;
  margin: 0;

  dt {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    color: @amarelo;
  }

  dd {
    margin: 4px 0 0;
    font-size: 16px;
    line-height: 1.3;
    color: #233b5c;
  }
}

.resumo-do-parlamentar__abas {
  :deep(.abas__navegacao) {
    margin-bottom: 56px;
  }

  :deep(.abas__lista > li) {
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 38px;
  }

  :deep(.abas__lista > li:not([hidden]) ~ li) {
    padding-left: 38px;
    border-left: 0.86px solid @c400;
  }

  :deep(.abas__link) {
    font-size: 13.71px;
    font-weight: 900;
    line-height: 24px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: @c600;
  }

  :deep(.abas-lista__item--aberta .abas__link) {
    color: @amarelo;
  }
}
</style>
