<script setup>
import { useTiposDeDocumentosStore } from '@/stores/tiposDeDocumentos.store';
import formatosDeImagem from '@/consts/formatosDeImagem';
import tiposDeArquivos from '@/consts/tiposDeArquivos';
import requestS from '@/helpers/requestS.ts';
import { useField } from 'vee-validate';
import {
  computed,
  defineModel,
  defineOptions,
  ref,
  toRef,
  watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const alertStore = useAlertStore();
const tiposDeDocumentosStore = useTiposDeDocumentosStore();

defineOptions({ inheritAttrs: false });

const emit = defineEmits(['envioBemSucedido', 'envioMalSucedido']);

const model = defineModel({
  required: true,
  default: '',
});

const props = defineProps({
  tipo: {
    type: String,
    required: true,
    validator: (valor) => tiposDeArquivos.indexOf(valor) > -1,
  },

  // HTML common attributes
  accept: {
    type: [
      Array,
      String,
    ],
    default: undefined,
  },
  // necessária para que o vee-validate não se perca
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
  },
});

const { lista: listaDeTiposDeDocumentos, tiposPorId } = storeToRefs(tiposDeDocumentosStore);

const name = toRef(props, 'name');
const pendente = ref(false);
const erro = ref('');
const zonaAtiva = ref(false);
const ativacaoDoArquivoPendente = ref(false);
const tipoDocumentoId = ref(0);

const { handleChange, errors } = useField(name, { required: props.required }, {
  initialValue: model.value,
});

const requerEscolhaDeTipo = computed(() => props.tipo === 'DOCUMENTO');

const campoDesabilitado = computed(() => !tipoDocumentoId.value && requerEscolhaDeTipo.value);

const listaDeExtensoesAceitas = computed(() => {
  const lista = !requerEscolhaDeTipo.value
    ? props.accept
    : tiposPorId.value[tipoDocumentoId.value]?.extensoes
    || undefined;

  return (typeof lista === 'string'
    ? lista.split(',')
    : lista)?.map((x) => (x.startsWith('.') ? x : `.${x}`)) || [];
});

const extensoesAceitasComoTexto = computed(() => (listaDeExtensoesAceitas.value
  ? listaDeExtensoesAceitas.value.reduce((acc, cur) => `${acc}${cur}, `, '').slice(0, -1)
  : undefined));

const ehImagem = computed(() => (listaDeExtensoesAceitas.value
  ? listaDeExtensoesAceitas.value
    .every((item) => formatosDeImagem.includes(item.trim().toLowerCase()))
  : false));

function removerArquivo() {
  handleChange('');

  model.value = '';
}

async function enviarArquivo(e) {
  if (campoDesabilitado.value) {
    zonaAtiva.value = false;
    return;
  }

  pendente.value = true;

  const { files } = (e.dataTransfer || e.target);
  const formData = new FormData();

  if (props.tipo) {
    formData.append('tipo', props.tipo);

    if (props.tipo === 'DOCUMENTO') {
      formData.append('tipo_documento_id', tipoDocumentoId.value);
    }
  }
  formData.append('arquivo', files[0]);

  try {
    const u = await requestS.upload(`${baseUrl}/upload`, formData);

    if (u.upload_token) {
      model.value = u.upload_token;
      ativacaoDoArquivoPendente.value = true;
      emit('envioBemSucedido', {
        nome_original: files[0].name,
        tamanho_bytes: files[0].size,
        ...u,
      });
    } else {
      throw new Error('Propriedade `upload_token` ausente da resposta.');
    }
  } catch (err) {
    erro.value = err;
    alertStore.error(err);
    emit('envioMalSucedido', err);
  } finally {
    pendente.value = false;
    zonaAtiva.value = false;
  }
}

watch(() => props.tipo, (novoValor) => {
  if (novoValor === 'DOCUMENTO' && !listaDeTiposDeDocumentos.value.length) {
    tiposDeDocumentosStore.buscarTudo();
  }
}, { immediate: true });
</script>
<template>
  <div
    class="campo-de-arquivo flex flexwrap g1"
  >
    <ErrorComponent v-if="erro">
      <div class="flex spacebetween center pl1">
        {{ erro }}
        <button
          class="like-a__link tprimary"
          aria-label="Fechar erro"
          title="Fechar erro"
          @click="erro = null"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_remove" /></svg>
        </button>
      </div>
    </ErrorComponent>

    <LoadingComponent
      v-else-if="pendente"
      class="campo-de-arquivo__chamada-pendente horizontal"
    />

    <template v-else>
      <div
        v-if="$props.tipo === 'DOCUMENTO'"
        class="f1"
      >
        <label class="label">Tipo de Documento <span class="tvermelho">*</span></label>
        <select
          v-model="tipoDocumentoId"
          name="tipo_documento_id"
          class="inputtext light mb1"
          :class="{ 'error': errors.tipo_documento_id }"
        >
          <option value="">
            Selecione
          </option>
          <option
            v-for="d in listaDeTiposDeDocumentos"
            :key="d.id"
            :value="d.id"
          >
            {{ d.titulo }}
          </option>
        </select>
        <div class="error-msg">
          {{ errors.tipo_documento_id }}
        </div>
      </div>

      <div
        class="campo-de-arquivo__area-de-envio f1 flex center g1 pt1 pb1"
        tabindex="0"
        :class="{ 'campo-de-arquivo__area-de-envio--ativa': zonaAtiva }"
        :aria-disabled="campoDesabilitado"
        @dragenter="zonaAtiva = true"
        @dragleave="zonaAtiva = false"
        @drop.stop.prevent="enviarArquivo"
        @dragover.stop.prevent="($ev) => { $ev.dataTransfer.dropEffect = 'copy' }"
      >
        <template v-if="!zonaAtiva">
          <template v-if="!model">
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_+" />
            </svg>
            <span class="f1">
              <slot>
                Adicionar (ou soltar) arquivo <template
                  v-if="extensoesAceitasComoTexto"
                >({{ extensoesAceitasComoTexto }})</template>
              </slot><template
                v-if="props.required"
              >&nbsp;<span class="tvermelho">*</span></template>
            </span>
          </template>

          <img
            v-else-if="!ativacaoDoArquivoPendente && ehImagem"
            :src="`${baseUrl}/download/${model}?inline=true`"
            width="100"
            class="campo-de-arquivo__amostra ib"
          >
          <span
            v-else
            class="campo-de-arquivo__token"
          >{{ model }}</span>
          <button
            v-if="model"
            class="campo-de-arquivo__botao-de-remoção like-a__link"
            type="button"
            aria-label="Remover arquivo"
            title="Remover arquivo"
            @click="removerArquivo"
          >
            <svg
              width="25"
              height="25"
            >
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </template>
        <template v-else-if="campoDesabilitado">
          Escolha um tipo de documento antes de enviar um arquivo.
        </template>
        <template v-else>
          soltar arquivo
        </template>
        <input
          :id="id"
          class="campo-de-arquivo__campo-em-si"
          type="file"
          :required="required"
          :accept="extensoesAceitasComoTexto"
          :aria-disabled="campoDesabilitado"
          :title="campoDesabilitado
            ? 'Escolha um tipo de documento antes de enviar um arquivo.'
            : undefined"
          @click="campoDesabilitado && $event.preventDefault()"
          @change.prevent="enviarArquivo"
        >
      </div>
    </template>
  </div>
</template>
<style lang="less">
.campo-de-arquivo {}

.campo-de-arquivo__chamada-pendente {}

.campo-de-arquivo__area-de-envio {
  position: relative;
  border-radius: 3px;
  cursor: pointer;
}

.campo-de-arquivo__area-de-envio--ativa {
  outline: 1px solid @c400;
  outline-offset: 3px;
  cursor: copy;
  text-align: center;
  justify-content: center;

  > * {
    opacity: 0.65;
  }

  &[aria-disabled='true'] {
    outline-color: @vermelho;
    cursor: not-allowed !important;
  }
}

.campo-de-arquivo__campo-em-si {
  cursor: pointer;
  position: absolute;
  opacity: 0 !important;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  .campo-de-arquivo__area-de-envio--ativa & {
    display: none;
  }
}

.campo-de-arquivo__amostra {
  object-fit: cover;
}

.campo-de-arquivo__token {
  display: inline-block;
  max-width: 12em;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.campo-de-arquivo__botao-de-remoção {
  position: relative;
  z-index: 1;
}
</style>
