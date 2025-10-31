<script setup>
import { storeToRefs } from 'pinia';
import { useField } from 'vee-validate';
import {
  computed, onMounted, ref, toRef, watch, watchEffect,
} from 'vue';
import { useRoute } from 'vue-router';
import isEqual from 'lodash/isEqual';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/texto/truncate';
import { useOrgansStore } from '@/stores/organs.store';
import SmaeTooltip from './SmaeTooltip/SmaeTooltip.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  órgãosPermitidos: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  limitarParaUmOrgao: {
    type: Boolean,
    default: false,
  },
  numeroMaximoDeParticipantes: {
    type: Number,
    default: undefined,
  },
  // Uma propriedade extra para evitar conferir a lista de órgãos a baixar em
  // cada atualização do valor do campo
  valoresIniciais: {
    type: Array,
    default: () => [],
    required: true,
    validator: (value) => Array.isArray(value),
  },
  orgaoLabel: {
    type: String,
    default: 'Órgão',
  },
  pessoasLabel: {
    type: String,
    default: 'Pessoas',
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
  // parâmetros de busca
  colaboradorDeProjeto: {
    type: Boolean,
    default: undefined,
  },
  coordenadorResponsavelCp: {
    type: Boolean,
    default: undefined,
  },
  email: {
    type: String,
    default: undefined,
  },
  espectadorDePainelExterno: {
    type: Boolean,
    default: undefined,
  },
  espectadorDeProjeto: {
    type: Boolean,
    default: undefined,
  },
  gestorDeProjeto: {
    type: Boolean,
    default: undefined,
  },
  orgaoId: {
    type: Number,
    default: undefined,
  },
  psAdminCp: {
    type: Boolean,
    default: undefined,
  },
  psPontoFocal: {
    type: Boolean,
    default: undefined,
  },
  psTecnicoCp: {
    type: Boolean,
    default: undefined,
  },
  orgaoInformativo: {
    type: String,
    default: undefined,
  },
  pessoaInformativo: {
    type: String,
    default: undefined,
  },
});

const route = useRoute();
const emit = defineEmits(['update:modelValue']);

const ÓrgãosStore = useOrgansStore();
const { organs } = storeToRefs(ÓrgãosStore);

const pessoasSimplificadas = ref([]);

const pessoasPorId = computed(() => pessoasSimplificadas.value.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {}));

const pessoasPorÓrgão = computed(() => pessoasSimplificadas.value.reduce((acc, cur) => {
  if (!acc[cur.orgao_id]) {
    acc[cur.orgao_id] = [];
  }
  acc[cur.orgao_id].push(cur);
  return acc;
}, {}));

const { handleChange, resetField } = useField(toRef(props, 'name'), undefined, {
  initialValue: props.valoresIniciais,
});

const órgãosDisponíveis = computed(() => {
  const órgãos = Array.isArray(organs.value) ? organs.value : [];

  return (
    props.órgãosPermitidos.length && órgãos
      ? órgãos.filter((x) => props.órgãosPermitidos.indexOf(x.id) !== -1)
      : órgãos
  ).filter((x) => !!pessoasPorÓrgão.value[x.id]?.length);
});

// usar lista para manter a ordem
const listaDeÓrgãos = ref([]);

// usar mapa para simplificar a conferência de órgãos já em uso
const mapaDeÓrgãos = computed(
  () => listaDeÓrgãos.value.reduce((acc, cur) => (
    { ...acc, [cur.id]: true }
  ), {}),
);

const órgãosEPessoas = computed(() => (Array.isArray(props.modelValue)
  ? props.modelValue.reduce((acc, cur) => {
    const chave = pessoasPorId.value[cur]?.orgao_id;

    if (!acc[chave]) {
      acc[chave] = {
        órgão: pessoasPorId.value[cur]?.orgao_id,
        pessoas: [],
      };
    }

    acc[chave].pessoas.push(cur);

    return acc;
  }, {}) : {}));

function removerLinha(índice) {
  const novoValor = Object.keys(órgãosEPessoas.value).reduce(
    (acc, cur) => (listaDeÓrgãos.value[índice].id === órgãosEPessoas.value[cur].órgão
      ? acc
      : acc.concat(órgãosEPessoas.value[cur].pessoas)),
    [],
  );

  listaDeÓrgãos.value.splice(índice, 1);
  handleChange(novoValor);
  emit('update:modelValue', novoValor);
}

function adicionarLinha() {
  listaDeÓrgãos.value.push({ id: 0 });
}

function adicionarPessoas(pessoas, índice) {
  const novoValor = listaDeÓrgãos.value.reduce(
    (acc, cur) => (listaDeÓrgãos.value[índice].id === órgãosEPessoas.value[cur.id]?.órgão
      || !órgãosEPessoas.value[cur.id]
      ? acc.concat(pessoas)
      : acc.concat(órgãosEPessoas.value[cur.id].pessoas)),
    [],
  );

  handleChange(novoValor);
  emit('update:modelValue', novoValor);
}

async function montar() {
  if (props.valoresIniciais.length) {
    if (!Array.isArray(organs.value) || !organs.value.length) {
      await ÓrgãosStore.getAll();
    }

    listaDeÓrgãos.value = Object.values(
      props.valoresIniciais.reduce((acc, cur) => {
        // usando reduce e um mapa para evitar o trabalho de remover duplicatas
        const chaveDoÓrgão = `_${pessoasPorId.value[cur]?.orgao_id}`;
        if (!acc[chaveDoÓrgão]) {
          acc[chaveDoÓrgão] = { id: pessoasPorId.value[cur]?.orgao_id };
        }
        return acc;
      }, {}),
    );
  }

  resetField({
    value: props.valoresIniciais,
  });
}

// assistindo mounted apenas para facilitar o desenvolvimento
onMounted(() => {
  montar();
});

watchEffect(async () => {
  const sufixo = route.meta.entidadeMãe === 'mdo' ? 'mdo_' : '';

  const { linhas } = await requestS.get(`${baseUrl}/pessoa/reduzido`, {
    colaborador_de_projeto: props.colaboradorDeProjeto,
    coordenador_responsavel_cp: props.coordenadorResponsavelCp,
    email: props.email,
    espectador_de_painel_externo: props.espectadorDePainelExterno,
    [`${sufixo}espectador_de_projeto`]: props.espectadorDeProjeto,
    gestor_de_projeto: props.gestorDeProjeto,
    orgao_id: props.orgaoId,
    ps_admin_cp: props.psAdminCp,
    ps_ponto_focal: props.psPontoFocal,
    ps_tecnico_cp: props.psTecnicoCp,
  });

  if (Array.isArray(linhas)) {
    pessoasSimplificadas.value = linhas;
    if (props.limitarParaUmOrgao && listaDeÓrgãos.value.length === 0) {
      listaDeÓrgãos.value.push({ id: 0 });
    }
    montar();
  } else {
    throw new Error('lista de pessoas entregue fora do padrão esperado');
  }
});

watch(
  () => props.valoresIniciais,
  (novos, antigos) => {
    if (!isEqual(novos, antigos)) {
      montar();
    }
  },
  { immediate: true },
);
</script>
<template>
  <div class="campo-de-pessoas">
    <div
      v-for="(item, idx) in listaDeÓrgãos"
      :key="item.id"
      class="campo-de-pessoas__inputs"
    >
      <div class="f1">
        <label
          :for="`${$props.name}__orgao--${idx}`"
          class="label tc300"
        >
          {{ props.orgaoLabel }}
          <SmaeTooltip
            v-if="$props.orgaoInformativo"
            class="campo-de-pessoas__tooltip"
            :texto="$props.orgaoInformativo"
          />
        </label>

        <select
          :id="`${$props.name}__orgao--${idx}`"
          v-model="listaDeÓrgãos[idx].id"
          class="inputtext light"
          :disabled="órgãosEPessoas[item.id]?.pessoas.length"
        >
          <option value="" />
          <option
            v-for="órgão in órgãosDisponíveis"
            :key="`${item.órgão}__órgão--${órgão.id}`"
            :value="órgão.id"
            :title="órgão.descricao?.length > 36 ? órgão.descricao : undefined"
            :disabled="
              mapaDeÓrgãos[órgão.id] && listaDeÓrgãos[idx].id !== órgão.id
            "
          >
            {{ órgão.sigla }} -
            {{ truncate(órgão.descricao, 36) }}
          </option>
        </select>
      </div>

      <div class="f2">
        <label
          :for="`${$props.name}__pessoas--${idx}`"
          class="label tc300"
        >
          {{ $props.pessoasLabel }}
          <SmaeTooltip
            v-if="$props.pessoaInformativo"
            class="campo-de-pessoas__tooltip"
            :texto="$props.pessoaInformativo"
          />
        </label>

        <AutocompleteField
          :id="`${$props.name}__pessoas--${idx}`"
          :controlador="{
            busca: '',
            participantes: órgãosEPessoas[item.id]?.pessoas || [],
          }"
          :model-value="órgãosEPessoas[item.id]?.pessoas"
          :grupo="pessoasPorÓrgão[listaDeÓrgãos[idx].id] || []"
          :readonly="readonly"
          :numero-maximo-de-participantes="numeroMaximoDeParticipantes"
          label="nome_exibicao"
          @change="
            ($newValue) => {
              adicionarPessoas($newValue, idx);
            }
          "
        />
      </div>

      <button
        v-if="!limitarParaUmOrgao"
        class="like-a__text addlink"
        aria-label="excluir"
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
      v-if="!limitarParaUmOrgao"
      class="like-a__text addlink"
      type="button"
      :disabled="
        $props.readonly ||
          !órgãosDisponíveis.length ||
          órgãosDisponíveis.length === listaDeÓrgãos.length
      "
      @click="adicionarLinha"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg>Adicionar órgão
    </button>

    <div
      v-if="!listaDeÓrgãos.length && !órgãosDisponíveis.length"
      class="error p1 error-msg"
    >
      Não há pessoas com o perfil necessário nos órgãos disponíveis.
    </div>

    <pre v-ScrollLockDebug>props.modelValue:{{ props.modelValue }}</pre>
  </div>
</template>
<style lang="less" scoped>
.campo-de-pessoas {
  container-type: inline-size;
  width: 100%;
}

.campo-de-pessoas__tooltip {
  position: static;
  min-width: 20px;
  height: 12px;
  transform: translateY(-50%);
}

.campo-de-pessoas__inputs {
  display: grid;
  gap: 1.5rem;
}

@container (width > 600px) {
  .campo-de-pessoas__inputs {
    display: flex;
    gap: 2rem;
    margin-bottom: 1rem;
  }
}

</style>
