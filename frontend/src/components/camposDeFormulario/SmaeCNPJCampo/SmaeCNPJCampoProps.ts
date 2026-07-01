import type { PropType } from 'vue';

const SmaeCNPJCampoProps = {
  anularVazio: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: undefined,
  },
  modelModifiers: {
    type: Object as PropType<Record<string, boolean>>,
    default: () => ({}),
  },
  name: {
    type: String,
    required: true,
  },
};

export default SmaeCNPJCampoProps;
