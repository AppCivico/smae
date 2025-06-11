import type { Directive, DirectiveBinding } from 'vue';
import { nextTick } from 'vue';

async function setAutofocus(el: HTMLElement, binding: DirectiveBinding) {
  const { modifiers, value } = binding;

  if (!el.hasAttribute('autofocus')) {
    el.setAttribute('autofocus', '');
  }

  if (!!value || value === undefined) {
    await nextTick();
    if (!(el.offsetParent || el.getClientRects().length)) {
      return;
    }
    el.focus();
    if (modifiers.select && el instanceof HTMLInputElement) {
      el.select();
    }
  }
}

const directive: Directive = {
  mounted: setAutofocus,
  updated: setAutofocus,
};

export default directive;
