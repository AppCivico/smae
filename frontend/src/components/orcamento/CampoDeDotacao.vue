<script setup>
import {
  computed, ref, toRef, watch,
} from 'vue';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { storeToRefs } from 'pinia';
import { dotação as schema } from '@/consts/formSchemas';
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
const { errors, handleChange, validate } = useField(name, schema, {
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
  dotaçãoEComplemento: {
    apenasDotação: 36,
    comComplemento: 46,
  },
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

const valorDaDotação = computed({
  get() {
    return props.modelValue;
  },
  set(valor) {
    handleChange(valor);
    emit('update:modelValue', valor);
  },
});

const valorDoComplemento = computed({
  get() {
    return props.complemento;
  },
  set(valor) {
    emit('update:complemento', valor);
  },
});

const dotaçãoEComplemento = computed({
  get: () => (props.complemento
    ? `${props.modelValue}.${props.complemento}`
    : props.modelValue),
  set(valor) {
    let valorLimpo = String(valor).replace(/([^0-9*])/g, '');

    if (props.complemento !== false) {
      valorLimpo = valorLimpo.slice(0, 35);
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
  },
});

async function validarDota() {
  const { valid } = await validate();

  if (valid) {
    try {
      respostaDoSof.value = { loading: true };
      const params = route.params.projetoId
        ? { portfolio_id: ProjetoStore.emFoco.portfolio_id }
        : { pdm_id: activePdm.value.id };
      respostaDoSof.value = await DotaçãoStore
        .getDotaçãoRealizado(dota.value, ano, params);
    } catch (error) {
      respostaDoSof.value = error;
    }
  }
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
  valorDaDotação.value = novoValor;
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
  valorDoComplemento.value = novoValor;
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
        v-model.trim="dotaçãoEComplemento"
        name="dotaçãoEComplemento"
        type="text"
        class="inputtext light mb1"
        :maxlength="props.complemento === false
          ? largurasDeCampo.dotaçãoEComplemento.apenasDotação
          : largurasDeCampo.dotaçãoEComplemento.comComplemento"
        :class="{
          error: errors?.dotacao || respostaDoSof.informacao_valida === false,
          loading: respostaDoSof.loading
        }"
        @keypress="($event) => mascararCódigos($event, ['*'])"
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
      v-if="props.complemento !== false"
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
          @keypress="mascararCódigos"
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
