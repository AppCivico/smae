<script setup>
// @todo entender e corrigir o motivo desse componente estar dando
// um looping infinito quando é atualizado pelo live reload
import AutocompleteField from '@/components/AutocompleteField2.vue';
import tipoDePerfil from '@/consts/tipoDePerfil';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/truncate';
import { useOrgansStore } from '@/stores/organs.store';
import { storeToRefs } from 'pinia';
import { useField } from 'vee-validate';
import {
  computed, ref, watch,
} from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  orgaosPermitidos: {
    type: Array,
    default: () => [],
  },
  equipesIds: {
    type: Array,
    default: () => null,
  },
  perfisPermitidos: {
    type: [Array, String],
    default: () => [],
    validator: (value) => (Array.isArray(value)
      ? value.every((x) => Object.keys(tipoDePerfil).includes(x))
      : Object.keys(tipoDePerfil).includes(value)),
  },
  prontoParaMontagem: {
    type: Boolean,
    default: false,
  },
  valoresIniciais: {
    type: Array,
    default: () => [],
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const orgaosStore = useOrgansStore();
const { organs } = storeToRefs(orgaosStore);

const equipes = ref([]);

const campoPronto = ref(false);

const equipesPorId = computed(() => equipes.value.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {}));

const listaPerfisPermitidos = computed(() => (typeof props.perfisPermitidos === 'string'
  ? [props.perfisPermitidos]
  : props.perfisPermitidos));

const equipesPorOrgao = computed(() => equipes.value.reduce((acc, cur) => {
  if (!acc[cur.orgao_id]) {
    acc[cur.orgao_id] = [];
  }

  if (!listaPerfisPermitidos.value.length || listaPerfisPermitidos.value.includes(cur.perfil)) {
    acc[cur.orgao_id].push(cur);
  }
  return acc;
}, {}));

const { handleChange, resetField } = useField(props.name, undefined, {
  initialValue: props.valoresIniciais,
});

const orgaosDisponiveis = computed(() => {
  const orgaos = Array.isArray(organs.value) ? organs.value : [];

  return (props.orgaosPermitidos.length && orgaos
    ? orgaos.filter((x) => props.orgaosPermitidos.indexOf(x.id) !== -1)
    : orgaos).filter((x) => !!equipesPorOrgao.value[x.id]?.length);
});

// usar lista para manter a ordem
const listaDeOrgaos = ref([]);

// usar mapa para simplificar a conferência de órgãos já em uso
const mapaDeOrgaos = computed(() => listaDeOrgaos.value
  .reduce((acc, cur) => ({ ...acc, [cur.id]: true }), {}));

const orgaosEquipes = computed(() => (props.modelValue || []).reduce((acc, cur) => {
  const chave = equipesPorId.value[cur]?.orgao_id;

  if (!acc[chave]) {
    acc[chave] = {
      orgao: equipesPorId.value[cur]?.orgao_id,
      equipes: [],
    };
  }

  acc[chave].equipes.push(cur);

  return acc;
}, {}));

function removerLinha(índice) {
  const novoValor = Object.keys(orgaosEquipes.value)
    .reduce((acc, cur) => (listaDeOrgaos.value[índice].id === orgaosEquipes.value[cur].orgao
      ? acc
      : acc.concat(orgaosEquipes.value[cur].equipes)), []);

  listaDeOrgaos.value.splice(índice, 1);
  handleChange(novoValor);
  emit('update:modelValue', novoValor);
}

function adicionarLinha() {
  listaDeOrgaos.value.push({ id: 0 });
}

function adicionarEquipes(equipesParaAdicionar, índice) {
  const novoValor = listaDeOrgaos.value
    .reduce((acc, cur) => (listaDeOrgaos.value[índice].id === orgaosEquipes.value[cur.id]?.orgao
      || !orgaosEquipes.value[cur.id]
      ? acc.concat(equipesParaAdicionar)
      : acc.concat(orgaosEquipes.value[cur.id].equipes)
    ), []);

  handleChange(novoValor);
  emit('update:modelValue', novoValor);
}

async function montar(valoresIniciais) {
  const promessas = [];

  campoPronto.value = false;

  if (!Array.isArray(organs.value) || !organs.value.length) {
    // aguardar por causa de possíveis outros componentes que dependem de órgãos
    promessas.push(orgaosStore.getAll());
  }

  if (!Array.isArray(equipes.value) || !equipes.value.length) {
    // aguardar para poder montar a lista de equipes agrupadas por órgão
    const buscaDeEquipe = requestS.get(`${baseUrl}/equipe-responsavel`)
      .then(({ linhas }) => {
        if (Array.isArray(linhas)) {
          // se o componente receber os ids possíveis de equipes,
          // retornar apenas as equipes selecionadas
          if (props.equipesIds) {
            const equipesFiltradas = linhas.filter((equipe) => props.equipesIds
              .includes(equipe.id));
            equipes.value = equipesFiltradas;
            return;
          }
          equipes.value = linhas;
        } else {
          throw new Error('lista de equipes entregue fora do padrão esperado');
        }
      });

    promessas.push(buscaDeEquipe);
  }

  await Promise.all(promessas);

  listaDeOrgaos.value = Object.values(valoresIniciais.reduce((acc, cur) => {
    // usando reduce e um mapa para evitar o trabalho de remover duplicatas
    const chaveDoOrgao = `_${equipesPorId.value[cur]?.orgao_id}`;
    if (!acc[chaveDoOrgao]) {
      acc[chaveDoOrgao] = { id: equipesPorId.value[cur]?.orgao_id };
    }
    return acc;
  }, {}));

  resetField({
    value: valoresIniciais,
  });

  campoPronto.value = true;
}

watch(() => props.valoresIniciais, async (novoValor) => {
  montar(novoValor);
}, { immediate: true });
</script>
<template>
  <div class="campo-de-equipes">
    <div
      v-for="(item, idx) in listaDeOrgaos"
      :key="item.id"
      class="flex g2 mb1"
    >
      <div class="f1">
        <label
          :for="`${$props.name}__orgao--${idx}`"
          class="label"
        >Órgão</label>
        <select
          :id="`${$props.name}__orgao--${idx}`"
          v-model="listaDeOrgaos[idx].id"
          class="inputtext light"
          :disabled="orgaosEquipes[item.id]?.equipes.length"
          :aria-busy="!campoPronto"
        >
          <option value="" />
          <option
            v-for="orgao in orgaosDisponiveis"
            :key="`${item.orgao}__órgão--${orgao.id}`"
            :value="orgao.id"
            :title="orgao.descricao?.length > 36 ? orgao.descricao : undefined"
            :disabled="mapaDeOrgaos[orgao.id] && listaDeOrgaos[idx].id !== orgao.id"
          >
            {{ orgao.sigla }} - {{ truncate(orgao.descricao, 36) }}
          </option>
        </select>
      </div>

      <div class="f2">
        <label
          :for="`${$props.name}__equipes--${idx}`"
          class="label"
        >Equipes</label>
        <AutocompleteField
          :id="`${$props.name}__equipes--${idx}`"
          :aria-busy="!campoPronto"
          :controlador="{
            busca: '',
            participantes: orgaosEquipes[item.id]?.equipes || []
          }"
          :model-value="orgaosEquipes[item.id]?.equipes"
          :grupo="equipesPorOrgao[listaDeOrgaos[idx].id] || []"
          label="titulo"
          @change="($newValue) => { adicionarEquipes($newValue, idx); }"
        />
      </div>

      <button
        class="like-a__text addlink"
        arial-label="excluir"
        title="excluir"
        @click="removerLinha(idx)"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_remove" /></svg>
      </button>
    </div>

    <button
      class="like-a__text addlink"
      type="button"
      :disabled="!orgaosDisponiveis.length
        || orgaosDisponiveis.length === listaDeOrgaos.length"
      @click="adicionarLinha"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg>Adicionar órgão
    </button>

    <div
      v-if="!orgaosDisponiveis.length"
      class="error p1 error-msg"
    >
      Não há equipes com os perfis necessários nos órgãos disponíveis.
    </div>

    <pre v-ScrollLockDebug>props.modelValue:{{ props.modelValue }}</pre>
  </div>
</template>
