<template>
  <li class="comunicado-geral-item card-shadow">
    <div class="comunicado-geral-item__header">
      <h4 class="comunicado-geral-item__header-title">
        {{ titulo.toLowerCase() }}
      </h4>
      <small class="comunicado-geral-item__header-date">
        {{ dataFormatada }}
      </small>
    </div>

    <div class="comunicado-geral-item__body">
      <p class="comunicado-geral-item__body-content">
        {{ conteudo }}
      </p>

      <a class="comunicado-geral-item__body-link">
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_link" /></svg>
        Link TransfereGov
      </a>
    </div>

    <div class="comunicado-geral-item__footer">
      <label class="comunicado-geral-item__footer-lido">
        {{ lido ? "Lido" : "Não lido" }}
        <input
          type="checkbox"
          class="interruptor"
          :checked="lido"
          @input="handleSelecionarLido"
        >
      </label>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { format } from 'date-fns';

import type { IComunicadoGeralItem } from '../interfaces/ComunicadoGeralItemInterface.ts';

type Props = IComunicadoGeralItem;
type Emits = {
  (event: 'update:lido', value: boolean): void;
};

const props = defineProps<Props>();
const $emit = defineEmits<Emits>();

const dataFormatada = computed<string>(() => format(props.data, "dd/MM/yyyy' às 'HH:mm"));

function handleSelecionarLido(ev: Event) {
  const target = ev.target as HTMLInputElement;

  $emit('update:lido', target.checked);
}
</script>

<style lang="less" scoped>
.comunicado-geral-item {
  display: flex;
  flex-direction: column;

  min-height: 497px;
  padding: 26px;
}

.comunicado-geral-item__header {
}

.comunicado-geral-item__header-title {
  font-size: 22px;
  font-weight: 700;
  line-height: 26px;
  color: #233b5c;
  margin: 0;
  text-transform: capitalize;
}

.comunicado-geral-item__header-date {
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: #3b5881;
}

.comunicado-geral-item__body {
  margin-top: 24px;
  flex-grow: 1;
}

.comunicado-geral-item__body-content {
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #000000;
  margin: 0;

  overflow: hidden;
  text-overflow: ellipsis;
}

.comunicado-geral-item__body-link {
  margin-left: 2px;
  margin-top: 6px;

  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-decoration: underline;
  color: #025b97;

  display: flex;
  align-items: center;
  gap: 3px;
}

.comunicado-geral-item__footer {
  margin-left: auto;
  padding-top: 48px;
}

.comunicado-geral-item__footer-lido {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
