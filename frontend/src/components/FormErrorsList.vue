<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps({
  errors: {
    type: Object,
    default: () => null,
  },
});

function rolarParaCampo(elemento: HTMLElement) {
  if (elemento) {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elemento.focus();
    // Simular :focus-visible
    if (typeof elemento.classList !== 'undefined') {
      elemento.classList.add('focus-visible');
      setTimeout(() => elemento.classList.remove('focus-visible'), 2000);
    }
  }
}

const listaComCampos = computed(() => Object.keys(props.errors || {})
  .map((nomeDoCampo) => {
    const nomeEscapado = CSS.escape(nomeDoCampo);
    const elemento: HTMLElement | null = document.querySelector(`[name="${nomeEscapado}"]`)
        || document.querySelector(`#${nomeEscapado}`);

    return {
      campo: nomeDoCampo,
      mensagem: Array.isArray(props.errors[nomeDoCampo])
        ? (props.errors[nomeDoCampo] as string[]).join('. ')
        : String(props.errors[nomeDoCampo]),
      elemento,
    };
  }));
</script>
<template>
  <div
    v-if="Object.keys(errors || {}).length"
    class="form-errors-report"
  >
    <p class="form-errors-report__message">
      Ajuste as informações destacadas abaixo para continuar:
    </p>

    <pre v-scrollLockDebug>errors:{{ errors }}</pre>

    <ul class="form-errors-report__list">
      <li
        v-for="item in listaComCampos"
        :key="item.campo"
        class="form-errors-report__item"
      >
        <svg
          class="form-errors-report__icone"
          width="24"
          height="24"
          color="#ee3b2b"
          aria-hidden="true"
        ><use xlink:href="#i_alert" /></svg>

        {{ item.mensagem }}

        <button
          v-if="item.elemento"
          class="form-errors-report__button like-a__text tipinfo"
          type="button"
          @click="rolarParaCampo(item.elemento as HTMLElement)"
        >
          <svg
            width="18"
            height="18"
            aria-hidden="true"
          ><use xlink:href="#i_arrow_up" /></svg>
          <div>Ir até o campo com erro</div>
        </button>
      </li>
    </ul>
  </div>
</template>
<style lang="less">
.form-errors-report {
  font-style: italic;
  line-height: 1.5;
  border-color: @vermelho;
  background-color: lighten(@vermelho, 40%);
  padding: 1rem;
  border-width: 4px 1px 1px;
  border-style: solid;
  .br(1rem);
}

.form-errors-report__message {}

.form-errors-report__list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.form-errors-report__item {
  list-style-type: none;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-start;
  flex-basis: 100%;
}

.form-errors-report__icone {
  display: inline-block;
  flex-shrink: 0;
}

.form-errors-report__button {
  display: inline-flex;
  align-items: center;

  &:hover,
  &:focus {
    color: @amarelo;
  }
}
</style>
