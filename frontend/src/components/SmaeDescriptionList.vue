<script setup lang="ts">
import { computed } from 'vue';

type ObjetoGenerico = Record<string, string | number | null | undefined>;

type ItemDeLista = {
  chave: string;
  titulo?: string;
  valor: string | number | null | undefined;
  atributosDoItem?: Record<string, unknown>;
  metadados?: Record<string, unknown>;
};

type Props = {
  objeto?: ObjetoGenerico;
  lista?: Array<ItemDeLista>;
};

const props = defineProps({
  objeto: {
    type: Object as () => ObjetoGenerico,
    required: false,
    default: () => null,
    validator(value: ObjetoGenerico | null, allProps: Props) {
      return (value !== null && typeof value === 'object') || allProps.lista !== undefined;
    },
  },
  lista: {
    type: Array as () => Array<ItemDeLista>,
    required: false,
    default: () => undefined,
    validator(value: Array<ItemDeLista>, allProps: Props) {
      return (value !== undefined && Array.isArray(value)) || allProps.objeto !== undefined;
    },
  },
  mapaDeTitulos: {
    type: Object as () => Record<string, string>,
    required: false,
    default: () => ({}),
  },
});

const listaConvertida = computed(() => {
  if (Array.isArray(props.lista)) {
    return props.lista.map((item) => ({
      ...item,
      titulo: item.titulo || props.mapaDeTitulos[item.chave] || undefined,
    }));
  }

  if (props.objeto !== null) {
    return Object.entries(props.objeto).map(([chave, valor]) => ({
      chave,
      valor,
      titulo: props.mapaDeTitulos[chave] || undefined,
      atributosDoItem: undefined,
      metadados: undefined,
    }));
  }

  return [];
});

</script>

<template>
  <dl
    v-if="listaConvertida.length"
    class="description-list flex g2 mb1 flexwrap"
  >
    <div
      v-for="(item, index) in listaConvertida"
      :key="index"
      class="description-list__item f1 mb1"
      v-bind="item.atributosDoItem"
    >
      <dt
        class="description-list__term t12 uc w700 mb05 tamarelo"
      >
        <slot
          :name="`termo--${item.chave}`"
          :item="item"
        >
          <slot
            name="termo"
            :item="item"
          >
            {{ item.titulo || item.chave }}
          </slot>
        </slot>
      </dt>
      <dd
        class="description-list__description t13"
      >
        <slot
          :name="`descricao--${item.chave}`"
          :item="item"
        >
          <slot
            name="descricao"
            :item="item"
          >
            {{ item.valor === 0 ? 0 : item.valor || '—' }}
          </slot>
        </slot>
      </dd>
    </div>
  </dl>
</template>

<style lang="less">
.description-list {
  + .description-list {
      border-top: 1px solid @c100;
      padding-top: 1rem;
      margin-top: 1rem;
    }
}

.description-list__item {

}

.description-list__term {

}

.description-list__description {

}
</style>
