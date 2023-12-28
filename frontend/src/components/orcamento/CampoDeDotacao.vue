<script setup>
import {
  computed, ref, toRef, watch,
} from 'vue';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { storeToRefs } from 'pinia';
import { orçamentoRealizado as schema } from '@/consts/formSchemas';
import { useMetasStore } from '@/stores/metas.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { ErrorMessage, useField } from 'vee-validate';
import { useRoute } from 'vue-router';

const props = defineProps({
  complemento: {
    type: [
      String,
      Boolean,
    ],
    default: false,
  },
  modelValue: {
    type: String,
    required: true,
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: 'dotacao',
  },
});

const emit = defineEmits([
  'update:modelValue',
  'update:complemento',
]);

const name = toRef(props, 'name');
const { handleChange } = useField(name, undefined, {
  initialValue: props.value,
});

const route = useRoute();

const DotaçãoStore = useDotaçãoStore();
const ProjetoStore = useProjetosStore();
const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);

const { ano } = route.params;

const { DotaçãoSegmentos, chamadasPendentes } = storeToRefs(DotaçãoStore);

const dota = ref('');
const respostaDoSof = ref({});

const largurasDeCampo = {
  dotação: {
    órgão: 2,
    unidade: 2,
    função: 2,
    subFunção: 3,
    programa: 4,
    projetoAtividade: 5,
    contaDespesa: 8,
    fonte: 2,
  },
  complemento: {
    complementoExercício: 1,
    complementoFonte: 3,
    complementoAcompanhamento: 6,
  },

};
const largurasDeCampoComoLista = {
  dotação: Object.values(largurasDeCampo.dotação),
  complemento: Object.values(largurasDeCampo.complemento),
};

const órgão = ref('');
const unidade = ref('');
const função = ref('');
const subFunção = ref('');
const programa = ref('');
const projetoAtividade = ref('');
const contaDespesa = ref('');
const fonte = ref('');

const complementoExercício = ref('');
const complementoFonte = ref('');
const complementoAcompanhamento = ref('');

const dotação = computed({
  get() {
    return props.modelValue;
  },
  set(valor) {
    handleChange(valor);
    emit('update:modelValue', valor);
  },
});

const complemento = computed({
  get() {
    return props.complemento;
  },
  set(valor) {
    emit('update:complemento', valor);
  },
});

const dotaçãoEComplemento = computed({
  get: () => (complemento.value
    ? `${dotação.value}.${complemento.value}`
    : dotação.value),
  set(valor) {
    const v = valor.split('.');

    órgão.value = v[0] !== undefined ? v[0] : '';
    unidade.value = v[1] !== undefined ? v[1] : '';
    função.value = v[2] !== undefined ? v[2] : '';
    subFunção.value = v[3] !== undefined ? v[3] : '';
    programa.value = v[4] !== undefined ? v[4] : '';
    projetoAtividade.value = v[5] !== undefined ? v[5] : '';

    if (v[6] !== undefined) {
      projetoAtividade.value += `.${v[6]}`;

      contaDespesa.value = v[7] !== undefined ? v[7] : '';
      fonte.value = v[8] !== undefined ? v[8] : '';

      complementoExercício.value = v[9] !== undefined ? v[9] : '';
      complementoFonte.value = v[10] !== undefined ? v[10] : '';
      complementoAcompanhamento.value = v[11] !== undefined ? v[11] : '';

      if (v[12] !== undefined) {
        complementoAcompanhamento.value += `.${v[12]}`;
      }
    }
  },
});

async function validarDota() {
  try {
    respostaDoSof.value = { loading: true };
    await schema.validate({ dotacao: dota.value, valor_empenho: 1, valor_liquidado: 1 });

    const params = route.params.projetoId
      ? { portfolio_id: ProjetoStore.emFoco.portfolio_id }
      : { pdm_id: activePdm.value.id };
    respostaDoSof.value = await DotaçãoStore
      .getDotaçãoRealizado(dota.value, ano, params);
  } catch (error) {
    respostaDoSof.value = error;
  }
}

function mascararCódigos(evt, alémDoBásico = []) {
  const teclasPermitidas = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    .concat(Array.isArray(alémDoBásico) ? alémDoBásico : [alémDoBásico]);

  if (!teclasPermitidas.includes(evt.key)) {
    evt.preventDefault();
  }
}

function mascararAcompanhamento(evt) {
  const teclasPermitidas = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];

  if (!teclasPermitidas.includes(evt.key) || (evt.key === '.' && evt.target.value.length)) {
    evt.preventDefault();
  } else if (evt.target.value.length === 4) {
    // eslint-disable-next-line no-param-reassign
    evt.target.value += '.';
  }
}

if (!DotaçãoSegmentos.value[ano]?.atualizado_em && !chamadasPendentes.value.segmentos) {
  DotaçãoStore.getDotaçãoSegmentos(ano);
}

watch([
  órgão, unidade, função, subFunção, programa, projetoAtividade, contaDespesa, fonte,
], (novosValores) => {
  let novoValor = '';
  let i = 0;
  while (novosValores[i]) {
    novoValor = novoValor
      ? `${novoValor}.${novosValores[i]}`
      : novosValores[i];
    i += 1;
  }

  if (novosValores[i - 1]?.length === largurasDeCampoComoLista.dotação[i - 1] && i < 7) {
    novoValor += '.';
  }
  dotação.value = novoValor;
});

watch([
  complementoExercício, complementoFonte, complementoAcompanhamento,
], (novosValores) => {
  let novoValor = '';
  let i = 0;
  while (novosValores[i]) {
    novoValor = novoValor
      ? `${novoValor}.${novosValores[i]}`
      : novosValores[i];
    i += 1;
  }

  if (novosValores[i - 1]?.length === largurasDeCampoComoLista.complemento[i - 1] && i < 3) {
    novoValor += '.';
  }
  complemento.value = novoValor;
});
</script>
<template>
  <div class="flex center g2">
    <div class="f1">
      <label
        class="label"
        for="campo-de-dotação"
      >Dotação <span class="tvermelho">*</span></label>
      <input
        id="campo-de-dotação"
        v-model="dotaçãoEComplemento"
        name="dotaçãoEComplemento"
        type="text"
        class="inputtext light mb1"
        maxlength="49"
        :class="{
          error: errors?.dotacao || respostaDoSof.informacao_valida === false,
          loading: respostaDoSof.loading
        }"
        @keypress="($event) => mascararCódigos($event, ['*', '.'])"
      >

      <ErrorMessage
        class="error-msg mb1"
        :name="name"
      />
      <div
        v-if="respostaDoSof.loading"
        class="t13 mb1 tc300"
      >
        Aguardando resposta do SOF
      </div>
      <div
        v-if="respostaDoSof.informacao_valida === false"
        class="t13 mb1 tvermelho"
      >
        Dotação não encontrada
      </div>
    </div>
  </div>
  <template v-if="DotaçãoSegmentos[ano]?.atualizado_em">
    <label class="label mb1">Dotação orçamentária - por segmento</label>
    <div class="flex g2 mb2">
      <div class="f1">
        <label
          for="órgão"
          class="label tc300"
        >Órgão <span class="tvermelho">*</span></label>
        <select
          id="órgão"
          v-model="órgão"
          name="órgão"
          class="inputtext light mb1"
        >
          <option
            v-for="i in DotaçãoSegmentos[ano].orgaos"
            :key="i.codigo"
            :value="i.codigo"
          >
            {{ i.codigo + ' - ' + i.descricao }}
          </option>
        </select>
        <div
          v-if="órgão"
          class="t12 tc500"
        >
          {{ (it = DotaçãoSegmentos[ano].orgaos.find(x => x.codigo == órgão))
            ? `${it.codigo} - ${it.descricao}`
            : '' }}
        </div>
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="unidade"
        >Unidade <span class="tvermelho">*</span></label>
        <select
          id="unidade"
          v-model="unidade"
          name="unidade"
          class="inputtext light mb1"
        >
          {{ (orgs = DotaçãoSegmentos[ano].unidades.filter(x => x.cod_orgao == órgão))
            ? ''
            : '' }}
          <option
            v-if="!orgs.length"
            value="00"
          >
            00 - Nenhum encontrado
          </option>
          <option
            v-for="i in orgs"
            :key="i.codigo"
            :value="i.codigo"
          >
            {{ i.codigo + ' - ' + i.descricao }}
          </option>
        </select>
        <div
          v-if="unidade"
          class="t12 tc500"
        >
          {{ (it = DotaçãoSegmentos[ano].unidades.find(x => x.codigo == unidade))
            ? `${it.codigo} - ${it.descricao}`
            : '' }}
        </div>
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="função"
        >Função <span class="tvermelho">*</span></label>
        <select
          id="função"
          v-model="função"
          name="função"
          class="inputtext light mb1"
        >
          <option
            v-for="i in DotaçãoSegmentos[ano].funcoes"
            :key="i.codigo"
            :value="i.codigo"
          >
            {{ i.codigo + ' - ' + i.descricao }}
          </option>
        </select>
        <div
          v-if="função"
          class="t12 tc500"
        >
          {{ (it = DotaçãoSegmentos[ano].funcoes.find(x => x.codigo == função))
            ? `${it.codigo} - ${it.descricao}`
            : '' }}
        </div>
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="subFunção"
        >Subfunção <span class="tvermelho">*</span></label>
        <select
          id="subFunção"
          v-model="subFunção"
          name="subFunção"
          class="inputtext light mb1"
        >
          <option
            v-for="i in DotaçãoSegmentos[ano].subfuncoes"
            :key="i.codigo"
            :value="i.codigo"
          >
            {{ i.codigo + ' - ' + i.descricao }}
          </option>
        </select>
        <div
          v-if="subFunção"
          class="t12 tc500"
        >
          {{ (it = DotaçãoSegmentos[ano].subfuncoes.find(x => x.codigo == subFunção))
            ? `${it.codigo} - ${it.descricao}`
            : '' }}
        </div>
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="programa"
        >Programa <span class="tvermelho">*</span></label>
        <select
          id="programa"
          v-model="programa"
          name="programa"
          class="inputtext light mb1"
        >
          <option
            v-for="i in DotaçãoSegmentos[ano].programas"
            :key="i.codigo"
            :value="i.codigo"
          >
            {{ i.codigo + ' - ' + i.descricao }}
          </option>
        </select>
        <div
          v-if="programa"
          class="t12 tc500"
        >
          {{ (it = DotaçãoSegmentos[ano].programas.find(x => x.codigo == programa))
            ? `${it.codigo} - ${it.descricao}`
            : '' }}
        </div>
      </div>
    </div>

    <div class="flex g2 mb2">
      <div class="f1">
        <label
          class="label tc300"
          for="projetoAtividade"
        >Projeto/atividade <span class="tvermelho">*</span></label>
        <select
          id="projetoAtividade"
          v-model="projetoAtividade"
          name="projetoAtividade"
          class="inputtext light mb1"
        >
          <option
            v-for="i in DotaçãoSegmentos[ano].projetos_atividades"
            :key="i.codigo"
            :value="i.codigo.slice(0, 1) + '.' + i.codigo.slice(1)"
          >
            {{ i.codigo + ' - ' + i.descricao }}
          </option>
        </select>
        <div
          v-if="projetoAtividade"
          class="t12 tc500"
        >
          {{ (it = DotaçãoSegmentos[ano].projetos_atividades
            .find(x => x.codigo == projetoAtividade?.replace('.', '')))
            ? `${it.codigo} - ${it.descricao}`
            : '' }}
        </div>
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="contaDespesa"
        >Conta despesa <span class="tvermelho">*</span></label>
        <input
          id="contaDespesa"
          v-model="contaDespesa"
          :maxlength="largurasDeCampo.dotação.contaDespesa"
          :minlength="largurasDeCampo.dotação.contaDespesa"
          name="contaDespesa"
          inputmode="numeric"
          type="text"
          class="inputtext light mb1"
          @keypress="mascararCódigos"
        >
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="fonte"
        >Fonte <span class="tvermelho">*</span></label>
        <select
          id="fonte"
          v-model="fonte"
          name="fonte"
          class="inputtext light mb1"
        >
          <option
            v-for="i in DotaçãoSegmentos[ano].fonte_recursos"
            :key="i.codigo"
            :value="i.codigo"
          >
            {{ i.codigo + ' - ' + i.descricao }}
          </option>
        </select>
        <div
          v-if="fonte"
          class="t12 tc500"
        >
          {{ (it = DotaçãoSegmentos[ano].fonte_recursos.find(x => x.codigo == fonte))
            ? `${it.codigo} - ${it.descricao}`
            : '' }}
        </div>
      </div>
    </div>

    <div
      v-if="complemento !== false"
      class="flex g2 mb2"
    >
      <div class="f1">
        <label
          class="label tc300"
          for="complementoExercício"
        >
          Exercício da Fonte de Recurso <span
            v-if="complementoExercício || complementoFonte || complementoAcompanhamento"
            class="tvermelho"
          >*</span>
        </label>
        <input
          id="complementoExercício"
          v-model="complementoExercício"
          class="inputtext light mb1"
          inputmode="numeric"
          :maxlength="largurasDeCampo.complemento.complementoExercício"
          :minlength="largurasDeCampo.complemento.complementoExercício"
          name="complementoExercício"
          step="1"
          type="text"
          @keypress="mascararCódigos"
        >
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="complementoFonte"
        >
          Fonte <span
            v-if="complementoExercício || complementoFonte || complementoAcompanhamento"
            class="tvermelho"
          >*</span>
        </label>
        <input
          id="complementoFonte"
          v-model="complementoFonte"
          class="inputtext light mb1"
          inputmode="numeric"
          :maxlength="largurasDeCampo.complemento.complementoFonte"
          :minlength="largurasDeCampo.complemento.complementoFonte"
          name="complementoFonte"
          step="1"
          type="text"
          @keypress="mascararCódigos"
        >
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="complementoAcompanhamento"
        >
          Código de Acompanhamento da Execução Orçamentária <span
            v-if="complementoExercício || complementoFonte || complementoAcompanhamento"
            class="tvermelho"
          >*</span>
        </label>
        <input
          id="complementoAcompanhamento"
          v-model="complementoAcompanhamento"
          class="inputtext light mb1"
          inputmode="numeric"
          :maxlength="largurasDeCampo.complemento.complementoAcompanhamento"
          :minlength="largurasDeCampo.complemento.complementoAcompanhamento"
          patter="\d{3}\.\d"
          name="complementoAcompanhamento"
          @keypress="mascararAcompanhamento"
        >
      </div>
    </div>
  </template>
  <div class="tc mb2">
    <button
      class="btn outline bgnone tcprimary"
      type="button"
      @click="validarDota()"
    >
      Validar via SOF
    </button>
  </div>
</template>
<style lang="less">
.error-msg {
  display: block;
}
</style>
