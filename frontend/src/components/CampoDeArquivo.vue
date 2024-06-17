<script setup>
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/truncate';
import { useField } from 'vee-validate';
import {
  computed,
  defineModel,
  defineOptions,
  ref,
  toRef,
} from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const formatosDeImagem = [
  '.apng',
  '.avif',
  '.gif',
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjpeg',
  '.pjp',
  '.png',
  '.svg',
  '.webp',
];

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
    validator: (valor) => [
      'DOCUMENTO',
      'FOTO_PARLAMENTAR',
      'ICONE_TAG',
      'IMPORTACAO_ORCAMENTO',
      'IMPORTACAO_PARLAMENTAR',
      'LOGO_PDM',
      'SHAPEFILE',
    ].indexOf(valor) > -1,
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

const name = toRef(props, 'name');
const pendente = ref(false);
const erro = ref('');
const zonaAtiva = ref(false);
const ativaçãoDoArquivoPendente = ref(false);

const { handleChange } = useField(name, { required: props.required }, {
  initialValue: model.value,
});

const éImagem = computed(() => (typeof props.accept === 'string'
  ? props.accept.split(',')
  : props.accept)
  .map((extensão) => extensão.trim())
  .every((item) => formatosDeImagem.includes(item)));

function removerArquivo() {
  handleChange('');

  model.value = '';
}

async function enviarArquivo(e) {
  pendente.value = true;

  const { files } = (e.dataTransfer || e.target);
  const formData = new FormData();

  if (props.tipo) {
    formData.append('tipo', props.tipo);
  }
  formData.append('arquivo', files[0]);

  try {
    const u = await requestS.upload(`${baseUrl}/upload`, formData);

    if (u.upload_token) {
      model.value = u.upload_token;
      ativaçãoDoArquivoPendente.value = true;
      emit('envioBemSucedido', u);
    } else {
      throw new Error('Propriedade `upload_token` ausente da resposta.');
    }
  } catch (err) {
    erro.value = err;
    emit('envioMalSucedido', err);
  } finally {
    pendente.value = false;
    zonaAtiva.value = false;
  }
}
</script>
<template>
  <div
    class="campo-de-arquivo"
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

    <div
      v-else
      class="campo-de-arquivo__area-de-envio flex center g1 pt1 pb1"
      tabindex="0"
      :class="{ 'campo-de-arquivo__area-de-envio--ativa': zonaAtiva }"
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
                v-if="props.accept"
              >({{ props.accept }})</template>
            </slot><template v-if="props.required">&nbsp;<span class="tvermelho">*</span></template>
          </span>
        </template>

        <img
          v-else-if="!ativaçãoDoArquivoPendente && éImagem"
          :src="`${baseUrl}/download/${model}?inline=true`"
          width="100"
          class="campo-de-arquivo__amostra ib mr1"
        >
        <span
          v-else
          class="ib mr1"
        >{{ truncate(model, 30) }}</span>
        <button
          v-if="model"
          class="campo-de-arquivo__botao-de-remoção like-a__link"
          type="button"
          aria-label="Remover arquivo"
          title="Remover arquivo"
          @click="removerArquivo"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_remove" />
          </svg>
        </button>
      </template>
      <template v-if="zonaAtiva">
        soltar arquivo
      </template>
      <input
        :id="id"
        class="campo-de-arquivo__campo-em-si"
        type="file"
        :required="required"
        :accept="props.accept"
        @change="enviarArquivo"
      >
    </div>
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

.campo-de-arquivo__botao-de-remoção {}
</style>
