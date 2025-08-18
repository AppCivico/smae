<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SmallModal from '@/components/SmallModal.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import { representatividade as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';

type Props = {
  apenasEmitir?: boolean,
  parlamentarId?: number | string
  representatividadeId?: number | string
  tipo: 'capital' | 'interior'
};

const props = withDefaults(defineProps<Props>(), {
  apenasEmitir: false,
  parlamentarId: 0,
  representatividadeId: 0,
});

const emit = defineEmits(['close']);

const mapaMunicipioTipo = {
  capital: 'Capital',
  interior: 'Interior',
};

const mapaNivel = {
  capital: 'Subprefeitura',
  interior: 'Municipio',
  padrao: 'Estado',
};

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();
const regionsStore = useRegionsStore();

const {
  emFoco, chamadasPendentes, representatividadeParaEdicao,
} = storeToRefs(parlamentaresStore);

const { regions: regiões, regiõesPorNível } = storeToRefs(regionsStore);

const {
  handleSubmit, resetForm, values, setFieldValue, validateField,
} = useForm({
  initialValues: representatividadeParaEdicao.value,
  validationSchema: schema,
});

const isCapital = computed(() => props.tipo === 'capital');
const mandatosPreparados = computed(() => {
  if (!emFoco.value || !emFoco.value.mandatos) {
    return [];
  }

  return emFoco.value.mandatos.map((item) => ({
    id: item.id,
    eleicao: item.eleicao.ano,
    cargo: cargosDeParlamentar[item.cargo].nome || item.cargo,
  }));
});

const regioesFiltradas = computed(() => {
  if (Object.keys(regiõesPorNível.value).length === 0) {
    return [];
  }

  const regioes = {
    capital: () => regiõesPorNível.value[3]?.slice().sort(
      (a, b) => a.descricao.localeCompare(b.descricao),
    ),
    interior: () => regiõesPorNível.value[1]?.slice().sort(
      (a, b) => a.descricao.localeCompare(b.descricao),
    ),
  };

  return regioes[props.tipo]();
});

async function handleEnviarDados(
  valoresControlados,
  { forcarEditar } = { forcarEditar: false },
) {
  const dados = {
    ...valoresControlados,
    municipio_tipo: mapaMunicipioTipo[props.tipo],
    nivel: mapaNivel[props.tipo] || mapaNivel.padrao,
    confirma_alteracao_comparecimento: forcarEditar,
  };

  try {
    await parlamentaresStore.salvarRepresentatividade(
      dados,
      props.representatividadeId,
      props.parlamentarId,
    );

    await parlamentaresStore.buscarItem(props.parlamentarId);

    alertStore.success('Representatividade atualizada!');
  } finally {
    if (props.apenasEmitir) {
      emit('close');
    }

    if (route.meta.rotaDeEscape) {
      router.push({
        name: route.meta.rotaDeEscape,
        params: route.params,
        query: route.query,
      });
    }
  }
}

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  if (
    representatividadeParaEdicao.value
    && representatividadeParaEdicao.value.numero_comparecimento !== values.numero_comparecimento
  ) {
    alertStore.confirmAction(
      'Atenção: ha um valor de comparecimento para essa eleição / cargo / região diferente do informado. A alteração deste valor implicará no recalculo dos percentuais de todos os parlamentares desta  eleição / cargo / região. Confirma alteração ?',
      () => {
        handleEnviarDados(valoresControlados, { forcarEditar: true });
      },
    );

    return;
  }

  handleEnviarDados(valoresControlados);
});

const formularioSujo = useIsFormDirty();

function iniciar() {
  if (!regiões.value.length) {
    regionsStore.getAll();
  }

  if (!parlamentaresStore.emFoco?.id !== Number(route.params?.parlamentarId)) {
    if (route.params?.parlamentarId) {
      parlamentaresStore.buscarItem(route.params?.parlamentarId);
    } else {
      alertStore.error('Você não está editando uma representatividade');
    }
  }
}

iniciar();

async function handleMudarMandatoOuRegiao() {
  const {
    mandato_id: mandatoId,
    regiao_id: regiaoId,
  } = values;

  if (!mandatoId || !regiaoId) {
    return;
  }

  const { comparecimentos } = await parlamentaresStore.buscarComparecimento(mandatoId);

  const regiao = comparecimentos.find((item) => item.regiao_id === regiaoId);
  if (!regiao) {
    setFieldValue('numero_comparecimento', null);
  } else {
    setFieldValue('numero_comparecimento', regiao.valor);
  }

  validateField('numero_comparecimento');
}

watch(representatividadeParaEdicao, (novoValor) => {
  if (
    props.representatividadeId
    && representatividadeParaEdicao.value?.regiao?.comparecimento?.valor
  ) {
    novoValor.numero_comparecimento = representatividadeParaEdicao.value
      .regiao.comparecimento.valor;
  }

  if (!novoValor) {
    return;
  }

  resetForm({
    values: {
      ...novoValor,
      pct_participacao: novoValor.pct_participacao.toFixed(1),
    },
  });
}, { immediate: true });
</script>

<template>
  <SmallModal @close="emit('close')">
    <div class="flex spacebetween center mb2">
      <TítuloDePágina>
        Representatividade parlamentar
      </TítuloDePágina>

      <hr class="ml2 f1">

      <CheckClose
        :apenas-emitir="props.apenasEmitir"
        :formulario-sujo="formularioSujo"
        @close="emit('close')"
      />
    </div>

    <LoadingComponent v-if="chamadasPendentes.equipe" />

    <form @submit="onSubmit">
      <div class="flex flexwrap g2">
        <div class="f1">
          <LabelFromYup
            name="mandato_id"
            :schema="schema"
          />

          <Field
            name="mandato_id"
            as="select"
            class="inputtext light"
            @change="handleMudarMandatoOuRegiao"
          >
            <option value="">
              Selecionar
            </option>

            <option
              v-for="mandato in mandatosPreparados"
              :key="mandato.id"
              :value="mandato.id"
            >
              {{ mandato.cargo }} -
              {{ mandato.eleicao || mandato.id }}
            </option>
          </Field>

          <ErrorMessage
            class="error-msg"
            name="mandato_id"
          />
        </div>

        <div class="f1">
          <SmaeLabel
            name="regiao_id"
            :schema="schema"
          >
            {{ isCapital ? 'Região' : 'Município' }}
          </SmaeLabel>

          <Field
            v-if="!props.representatividadeId"
            name="regiao_id"
            as="select"
            class="inputtext light"
            :disabled="regioesFiltradas.length === 0"
            @change="handleMudarMandatoOuRegiao"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="região in regioesFiltradas"
              :key="região.id"
              :value="região.id"
            >
              {{ região.descricao }}
            </option>
          </Field>

          <input
            v-else
            type="text"
            disabled
            class="inputtext light"
            :value="representatividadeParaEdicao?.regiao?.descricao"
            :class="{ loading: chamadasPendentes.emFoco }"
          >

          <ErrorMessage
            class="error-msg"
            name="regiao_id"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mt1">
        <div class="f1">
          <SmaeLabel
            name="numero_votos"
            :schema="schema"
          />

          <Field
            v-model.number="values.numero_votos"
            name="numero_votos"
            type="number"
            class="inputtext light"
            min="0"
            step="1"
          />

          <ErrorMessage
            class="error-msg"
            name="numero_votos"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="numero_comparecimento"
            :schema="schema"
          />

          <Field
            v-model.number="values.numero_comparecimento"
            name="numero_comparecimento"
            type="number"
            class="inputtext light"
            min="0"
            step="1"
          />

          <ErrorMessage
            class="error-msg"
            name="numero_comparecimento"
          />
        </div>

        <div
          v-if="props.representatividadeId"
          class="f1"
        >
          <LabelFromYup
            name="pct_participacao"
            :schema="schema"
          />

          <Field
            v-model.number="values.pct_participacao"
            name="pct_participacao"
            type="number"
            class="inputtext light"
            step="0.01"
            disabled
          />

          <ErrorMessage
            class="error-msg"
            name="pct_participacao"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="ranking"
            :schema="schema"
          />

          <Field
            v-model.number="values.ranking"
            name="ranking"
            type="number"
            class="inputtext light mb1"
            step="1"
          />

          <ErrorMessage
            class="error-msg"
            name="ranking"
          />
        </div>
      </div>

      <div class="flex justifycenter center mt2">
        <button
          type="submit"
          class="btn big"
        >
          Salvar
        </button>
      </div>
    </form>
  </SmallModal>
</template>
