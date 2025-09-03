<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, useField } from 'vee-validate';
import {
  computed, ref, toRef, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { dotação as schema } from '@/consts/formSchemas';
import dinheiro from '@/helpers/dinheiro';
import toFloat from '@/helpers/toFloat';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
// PRA-FAZER: preenchimento inicial dos campos de parciais
const props = defineProps({
  parametrosParaValidacao: {
    type: Object,
    default: null,
    required: true,
    validator: (valorDaProp) => valorDaProp.pdm_id || valorDaProp.portfolio_id,
  },
  complemento: {
    type: String,
    default: '',
  },
  dotação: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    required: true,
  },
  respostasof: {
    type: Object,
    default: () => ({}),
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: 'dotacao_cheia',
  },
});

const emit = defineEmits([
  'update:modelValue',
  'update:complemento',
  'update:dotação',
  'update:respostasof',
]);

const name = toRef(props, 'name');
const {
  errors, handleChange, validate, meta: metaDadosDoFormulario,
} = useField(name, schema, {
  initialValue: props.value,
});

const route = useRoute();

const DotaçãoStore = useDotaçãoStore();

const { ano } = route.params;

const { DotaçãoSegmentos, chamadasPendentes } = storeToRefs(DotaçãoStore);

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
    complementoAcompanhamento: 4,
    complementoOrigem: 1,
  },
  dotaçãoEComplemento: {
    apenasDotação: 36,
    comComplemento: 48,
  },
};

const validando = ref(false);

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
const complementoOrigem = ref('');

const valorDaDotação = computed(() => {
  const campos = [
    órgão, unidade, função, subFunção, programa, projetoAtividade, contaDespesa, fonte,
  ];
  let valor = '';

  let i = 0;
  while (campos[i]?.value) {
    valor += i > 0
      ? `.${campos[i].value}`
      : campos[i].value;
    i += 1;
  }
  return valor;
});

const valorDoComplemento = computed(() => {
  const campos = [
    complementoExercício,
    complementoFonte,
    complementoAcompanhamento,
    complementoOrigem,
  ];
  let valor = '';

  let i = 0;
  while (campos[i]?.value) {
    valor += i > 0
      ? `.${campos[i].value}`
      : campos[i].value;
    i += 1;
  }
  return valor;
});

const dotaçãoCheia = computed(() => (valorDoComplemento.value
  ? `${valorDaDotação.value}.${valorDoComplemento.value}`
  : valorDaDotação.value));

const dotaçãoEComplemento = computed({
  get: () => props.modelValue,
  set(valor) {
    let valorLimpo = String(valor).replace(/([^0-9*])/g, '');

    if (props.complemento !== false) {
      valorLimpo = valorLimpo.slice(0, 36);
    } else {
      valorLimpo = valorLimpo.slice(0, 27);
    }

    if (valorLimpo.length) {
      órgão.value = valorLimpo.slice(0, 2);
    } else {
      órgão.value = '';
    }

    if (valorLimpo.length >= 2) {
      unidade.value = valorLimpo.slice(2, 4);
    } else {
      unidade.value = '';
    }

    if (valorLimpo.length >= 4) {
      função.value = valorLimpo.slice(4, 6);
    } else {
      função.value = '';
    }

    if (valorLimpo.length >= 6) {
      subFunção.value = valorLimpo.slice(6, 9);
    } else {
      subFunção.value = '';
    }

    if (valorLimpo.length >= 9) {
      programa.value = valorLimpo.slice(9, 13);
    } else {
      programa.value = '';
    }

    if (valorLimpo.length >= 13) {
      if (valorLimpo.charAt(14)) {
        projetoAtividade.value = `${valorLimpo.charAt(13)}.${valorLimpo.slice(14, 17)}`;
      } else {
        projetoAtividade.value = valorLimpo.charAt(13);
      }
    } else {
      projetoAtividade.value = '';
    }

    if (valorLimpo.length >= 17) {
      contaDespesa.value = valorLimpo.slice(17, 25);
    } else {
      contaDespesa.value = '';
    }

    if (valorLimpo.length >= 25) {
      fonte.value = valorLimpo.slice(25, 27);
    } else {
      fonte.value = '';
    }

    if (valorLimpo.length >= 27) {
      complementoExercício.value = valorLimpo.slice(27, 28);
    } else {
      complementoExercício.value = '';
    }

    if (valorLimpo.length >= 28) {
      complementoFonte.value = valorLimpo.slice(28, 31);
    } else {
      complementoFonte.value = '';
    }

    if (valorLimpo.length >= 31) {
      complementoAcompanhamento.value = valorLimpo.slice(31, 35);
    } else {
      complementoAcompanhamento.value = '';
    }

    if (valorLimpo.length >= 35) {
      complementoOrigem.value = valorLimpo.slice(35, 36);
    } else {
      complementoOrigem.value = '';
    }
  },
});

async function validarDota() {
  if (!metaDadosDoFormulario?.valid) return;

  validando.value = true;

  const { valid } = await validate();

  if (valid) {
    try {
      emit('update:respostasof', { loading: true });
      const respostaDoSof = await DotaçãoStore
        .getDotaçãoRealizado(valorDaDotação.value, ano, props.parametrosParaValidacao);
      emit('update:respostasof', respostaDoSof);
    } catch (error) {
      emit('update:respostasof', error);
    }
  }
  validando.value = false;
}

function mascararCódigos(evt, alémDoBásico = []) {
  const teclasPermitidas = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    .concat(Array.isArray(alémDoBásico) ? alémDoBásico : [alémDoBásico]);

  if (!teclasPermitidas.includes(evt.key)) {
    evt.preventDefault();
  }
}

if (!DotaçãoSegmentos.value[ano]?.atualizado_em && !chamadasPendentes.value.segmentos) {
  DotaçãoStore.getDotaçãoSegmentos(ano);
}

watch(valorDaDotação, (novoValor) => {
  handleChange(dotaçãoCheia.value);
  emit('update:modelValue', dotaçãoCheia.value);
  emit('update:dotação', novoValor);
});

watch(valorDoComplemento, (novoValor) => {
  handleChange(dotaçãoCheia.value);
  emit('update:modelValue', dotaçãoCheia.value);
  emit('update:complemento', novoValor);
});
</script>
<template>
  <div class="flex flexwrap center g2">
    <div class="f1">
      <label
        class="label"
        for="campo-de-dotação"
      >Dotação&nbsp;<span class="tvermelho">*</span></label>
      <input
        id="campo-de-dotação"
        v-model.trim="dotaçãoEComplemento"
        name="dotaçãoEComplemento"
        type="text"
        class="inputtext light mb1"
        :maxlength="props.complemento === false
          ? largurasDeCampo.dotaçãoEComplemento.apenasDotação
          : largurasDeCampo.dotaçãoEComplemento.comComplemento"
        :class="{
          error: errors?.dotacao || respostasof.informacao_valida === false,
          loading: respostasof.loading
        }"
        @keypress="($event) => mascararCódigos($event, ['*'])"
      >

      <ErrorMessage
        class="error-msg mb1"
        :name="name"
      />
      <div
        v-if="respostasof.loading"
        class="t13 mb1 tc300"
      >
        Aguardando resposta do SOF
      </div>
      <div
        v-if="respostasof.informacao_valida === false"
        class="t13 mb1 tvermelho"
      >
        Dotação não encontrada
      </div>
    </div>
  </div>
  <template v-if="DotaçãoSegmentos[ano]?.atualizado_em">
    <label class="label mb1">Dotação orçamentária - por segmento</label>
    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <label
          for="órgão"
          class="label tc300"
        >Órgão&nbsp;<span class="tvermelho">*</span></label>
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
        >Unidade&nbsp;<span class="tvermelho">*</span></label>
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
        >Função&nbsp;<span class="tvermelho">*</span></label>
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
        >Subfunção&nbsp;<span class="tvermelho">*</span></label>
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
        >Programa&nbsp;<span class="tvermelho">*</span></label>
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

    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <label
          class="label tc300"
          for="projetoAtividade"
        >Projeto/atividade&nbsp;<span class="tvermelho">*</span></label>
        <select
          id="projetoAtividade"
          v-model="projetoAtividade"
          name="projetoAtividade"
          class="inputtext light mb1"
        >
          <option
            v-for="i in DotaçãoSegmentos[ano].projetos_atividades"
            :key="i.codigo"
            :value="i.codigo.charAt(0) + '.' + i.codigo.slice(1)"
          >
            {{ i.codigo.charAt(0) + '.' + i.codigo.slice(1) + ' - ' + i.descricao }}
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
        >Conta despesa&nbsp;<span class="tvermelho">*</span></label>
        <input
          id="contaDespesa"
          v-model="contaDespesa"
          :maxlength="largurasDeCampo.dotação.contaDespesa"
          :minlength="largurasDeCampo.dotação.contaDespesa"
          name="contaDespesa"
          inputmode="numeric"
          type="text"
          class="inputtext light mb1"
        >
      </div>
      <div class="f1">
        <label
          class="label tc300"
          for="fonte"
        >Fonte&nbsp;<span class="tvermelho">*</span></label>
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
      v-if="props.complemento !== false"
      class="flex flexwrap g2 mb2"
    >
      <div class="f1">
        <label
          class="label tc300"
          for="complementoExercício"
        >
          Exercício da Fonte de Recurso&nbsp;<span class="tvermelho">*</span>
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
          Fonte&nbsp;<span class="tvermelho">*</span>
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
          Acompanhamento da Execução Orçamentária&nbsp;<span class="tvermelho">*</span>
        </label>
        <input
          id="complementoAcompanhamento"
          v-model="complementoAcompanhamento"
          class="inputtext light mb1"
          inputmode="numeric"
          :maxlength="largurasDeCampo.complemento.complementoAcompanhamento"
          :minlength="largurasDeCampo.complemento.complementoAcompanhamento"
          pattern="\d{4}"
          name="complementoAcompanhamento"
          @keypress="mascararCódigos"
        >
      </div>
      <div class="f05">
        <label
          class="label tc300"
          for="complementoOrigem"
        >
          Origem do Recurso&nbsp;<span class="tvermelho">*</span>
        </label>
        <input
          id="complementoOrigem"
          v-model="complementoOrigem"
          class="inputtext light mb1"
          inputmode="numeric"
          :maxlength="largurasDeCampo.complemento.complementoOrigem"
          :minlength="largurasDeCampo.complemento.complementoOrigem"
          pattern="\d"
          name="complementoOrigem"
          @keypress="mascararCódigos"
        >
      </div>
    </div>
  </template>

  <FormErrorsList :errors="errors" />

  <div class="tc mb2">
    <button
      class="btn outline bgnone tcprimary"
      type="button"
      :aria-disabled="!metaDadosDoFormulario?.valid"
      :aria-busy="validando"
      @click="validarDota()"
    >
      Validar via SOF
    </button>
  </div>

  <table
    v-if="respostasof.projeto_atividade != undefined"
    class="tablemain mb4"
  >
    <thead>
      <tr>
        <th style="width: 25%">
          Nome do projeto/atividade
        </th>
        <th style="width: 25%">
          Empenho SOF
        </th>
        <th style="width: 25%">
          Liquidação SOF
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="w700">
          {{ respostasof.projeto_atividade }}
        </td>
        <td>R$ {{ dinheiro(toFloat(respostasof.empenho_liquido)) }}</td>
        <td>R$ {{ dinheiro(toFloat(respostasof.valor_liquidado)) }}</td>
      </tr>
    </tbody>
  </table>
</template>
<style lang="less">
.error-msg {
  display: block;
}
</style>
