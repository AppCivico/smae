<script setup>
import dateToField from '@/helpers/dateToField';
import truncate from '@/helpers/texto/truncate';
import { ref } from 'vue';
import oArquivoEhEditavel from './ArvoreDeArquivos.helpers/oArquivoEhEditavel';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  aninhado: {
    type: Boolean,
    default: false,
  },
  apenasLeitura: {
    type: Boolean,
    default: false,
  },
  arquivosAgrupadosPorCaminho: {
    type: Object,
    default: () => ({}),
  },
  listaDeDiretórios: {
    type: Array,
    required: true,
  },
  exibirConteúdo: {
    type: Boolean,
    default: true,
  },
  temArquivos: {
    type: Boolean,
    default: true,
  },
  rotaDeAdição: {
    type: Object,
    default: null,
  },
  rotaDeEdição: {
    type: Object,
    default: null,
  },
});

defineEmits(['apagar', 'editar']);

const fecharFilha = ref([]);

const éPossívelAbrir = (item) => !item.children?.length
  && !props.arquivosAgrupadosPorCaminho?.[item.caminho]?.length;
</script>
<template>
  <Transition name="fade">
    <ul
      v-if="listaDeDiretórios.length || temArquivos"
      v-show="exibirConteúdo"
      class="arvore-de-arquivos"
    >
      <li
        v-for="item, i in listaDeDiretórios"
        :key="`diretorio--${item.id || i}`"
        class="arvore-de-arquivos__item arvore-de-arquivos__item--diretorio"
      >
        <span class="arvore-de-arquivos__linha">
          <label
            class="like-a__text arvore-de-arquivos__abrir"
            :class="{
              'arvore-de-arquivos__abrir--desabilitada': éPossívelAbrir(item)
            }"
          >
            <input
              v-model="fecharFilha"
              hidden
              type="checkbox"
              :value="item.id"
              :disabled="éPossívelAbrir(item)"
            >
            <svg
              title="fechar/abrir lista de arquivos"
              width="20"
              height="20"
            ><use
              :xlink:href="fecharFilha.includes(item.id)
                || éPossívelAbrir(item)
                ? '#i_folder'
                : '#i_folder-open'"
            /></svg>
          </label>

          <strong class="arvore-de-arquivos__nome">
            {{ item.id }}
          </strong>

          <SmaeLink
            v-if="props.rotaDeAdição && !apenasLeitura"
            class="like-a__text arvore-de-arquivos__adicionar"
            :aria-label="`adicionar arquivo em ${item.caminho}`"
            :to="{
              ...props.rotaDeAdição,
              query: {
                diretorio_caminho: item.caminho
              }
            }"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>
          </SmaeLink>
        </span>
        <ArvoreDeArquivos
          :key="`diretorio--${item.id || i}__arvore`"
          :aninhado="true"
          :lista-de-diretórios="item.children"
          :tem-arquivos="!!arquivosAgrupadosPorCaminho?.[item.caminho]?.length"
          :arquivos-agrupados-por-caminho="arquivosAgrupadosPorCaminho"
          :exibir-conteúdo="!fecharFilha.includes(item.id)"
          :apenas-leitura="apenasLeitura"
          :rota-de-adição="props.rotaDeAdição"
          :rota-de-edição="props.rotaDeEdição"
          @apagar="($params) => $emit('apagar', $params)"
          @editar="($params) => $emit('editar', $params)"
        >
          <template v-if="arquivosAgrupadosPorCaminho?.[item.caminho]">

            <li
              v-for="arquivo, j in arquivosAgrupadosPorCaminho[item.caminho]"
              :key="`diretorio--${item.id || i}__arquivo--${arquivo.id || j}`"
              class="arvore-de-arquivos__item arvore-de-arquivos__item--arquivo"
            >
              <span class="arvore-de-arquivos__linha">
                <component
                  :is="arquivo?.arquivo?.download_token ? 'a' : 'span'"
                  :href="arquivo?.arquivo?.download_token
                    ? baseUrl + '/download/' + arquivo?.arquivo?.download_token
                    : undefined"
                  download
                  class="arvore-de-arquivos__descricao"
                >
                  <span v-if="arquivo?.descricao">
                    {{ truncate(arquivo?.descricao, 300) }} --
                  </span>
                  <span>
                    {{ truncate((arquivo?.arquivo?.nome_original), 16) }}
                  </span>
                </component>

                <small
                  v-if="arquivo?.data"
                  class="arvore-de-arquivos__data ml1"
                >
                  {{ dateToField(arquivo?.data) }}
                </small>

                <SmaeLink
                  v-if="props.rotaDeEdição && !apenasLeitura"
                  class="like-a__text arvore-de-arquivos__editar"
                  :aria-label="`editar propriedades de ${arquivo?.arquivo?.nome_original}`"
                  :to="{
                    ...props.rotaDeEdição,
                    params: {
                      arquivoId: arquivo?.id
                    },
                  }"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </SmaeLink>
                <button
                  v-if="oArquivoEhEditavel(apenasLeitura, arquivo.pode_editar)"
                  type="button"
                  class="like-a__text arvore-de-arquivos__apagar"
                  aria-label="apagar"
                  @click="$emit('apagar', {
                    id: arquivo?.id,
                    nome: arquivo?.arquivo?.nome_original
                  })"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_waste" /></svg>
                </button>

              </span>
            </li>
          </template>
        </ArvoreDeArquivos>
      </li>
      <slot />
    </ul>
  </Transition>
</template>
<style lang="less">
.arvore-de-arquivos {
  flex-basis: 100%;

  .arvore-de-arquivos {
    position: static;

    &:before {
      content: '';
      height: 0;
      flex-basis: 100%;
      border-bottom: 1px solid @c100;
      position: absolute;
      width: auto;
      right: 0;
      left: 0;
    }
  }

  label {
    cursor: pointer;
  }

  button {
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  }

  .arvore-de-arquivos__item {
    background-color: @branco;
    min-width: 14em;
    width: 100%;

    &:after {
      content: '';
      height: 0;
      flex-basis: 100%;
      color: @c100;
      border-bottom: 1px solid currentColor;
      position: absolute;
      width: auto;
      right: 0;
      left: 0;
    }

    .arvore-de-arquivos__item {
      padding-left: 1.8rem;
      background-color: transparent;
    }
  }

  &.arvore-de-arquivos--raiz {
    .rolavel-horizontalmente;

    // para evitar vara de rolagem vertical, quando houver rolagem horizontal
    padding-bottom: 1px;
  }

  .arvore-de-arquivos__linha {
    display: flex;
    padding: 0.75em 1em 0.75em 0;
    align-items: center;
    gap: 1rem;
  }

  .arvore-de-arquivos__nome {
    min-width: 3em;
    flex-basis: 0;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: auto;
  }

  .arvore-de-arquivos__descricao {
    flex-basis: 0;
    flex-grow: 1;
    color: @c600;
  }

  .arvore-de-arquivos__data {
    margin-right: calc(20px + 2rem);
    flex-basis: 0;
    flex-grow: 1;
    white-space: nowrap;
    max-width: min-content;
  }

  .arvore-de-arquivos__abrir {
    margin-left: 0;
    flex-shrink: 0;

    &:hover {
      color: @laranja;
    }
  }

  .arvore-de-arquivos__abrir--desabilitada {
    cursor: default;

    &:hover {
      color: inherit;
    }
  }

  .arvore-de-arquivos__item--diretorio {}

  .arvore-de-arquivos__item--arquivo {
    // &:nth-child(odd) {
    //   background-color: @c50;
    // }
  }

  .arvore-de-arquivos__adicionar {
    &:hover {
      color: @laranja;
    }

    &:last-child {
      margin-right: calc(20px * 2 + 2rem);
    }
  }

  .arvore-de-arquivos__editar {
    &:hover {
      color: @laranja;
    }
  }

  .arvore-de-arquivos__apagar {
    &:hover {
      color: @laranja;
    }

    margin-right: 0;
  }
}
</style>
