import type { Directive, DirectiveBinding } from 'vue';

const alternarExibicao = (el: HTMLElement, binding: DirectiveBinding) => {
  const primária = 'Control';
  const secundária = 'CapsLock';

  el.classList.add('debug');
  el.setAttribute('hidden', '');
  let secundáriaPressionada = false;

  if (binding.value) {
    el.setAttribute('data-debug', binding.value);
  }
  window.addEventListener('keydown', (event) => {
    if (event.getModifierState && event.getModifierState(primária)) {
      if (event.key === secundária) {
        if (secundáriaPressionada) {
          if (el.hasAttribute('hidden')) {
            el.removeAttribute('hidden');
          } else {
            el.setAttribute('hidden', '');
          }
          secundáriaPressionada = false;
        } else {
          secundáriaPressionada = true;
          setTimeout(() => {
            secundáriaPressionada = false;
          }, 300);
        }
      } else if (secundáriaPressionada) {
        secundáriaPressionada = false;
      }
    }
  });
};

const diretiva: Directive = {
  beforeMount: alternarExibicao,
};

export default diretiva;
