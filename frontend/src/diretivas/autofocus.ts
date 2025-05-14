import type { Directive } from 'vue';
import { nextTick } from 'vue';

const directive: Directive = {
  mounted: async (el:HTMLElement, binding) => {
    const { modifiers, value } = binding;

    if (!!value || value === undefined) {
      await nextTick();
      el.focus();
      if (modifiers.select && el instanceof HTMLInputElement) {
        el.select();
      }
    }
  },
};

export default directive;
