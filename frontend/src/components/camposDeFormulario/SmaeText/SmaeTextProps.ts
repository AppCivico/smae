const SmaeTextProps = {
  as: {
    type: String,
    default: 'input',
    validator: (value: string) => ['input', 'textarea'].includes(value.toLocaleLowerCase()),
  },
  anularVazio: {
    type: Boolean,
    default: false,
  },
  // Porque os atributos padrão vão para o campo
  atributosDaRaiz: {
    type: Object,
    default: null,
  },
  // Aceitar caixas diferentes
  maxlength: {
    type: [Number, String],
    default: 0,
  },
  // Aceitar caixas diferentes
  maxLength: {
    type: [Number, String],
    default: 0,
  },
  modelValue: {
    type: String,
    default: '',
  },
  modelModifiers: {
    type: Object as PropType<Record<string, boolean>>,
    default: () => ({}),
  },
  name: {
    type: String,
    required: true,
  },
  schema: {
    type: Object as PropType<AnyObjectSchema>,
    default: () => null,
  },
};

export default SmaeTextProps;
