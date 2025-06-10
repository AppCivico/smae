/* eslint-disable no-template-curly-in-string */
export default {
  array: {
    min: ({ label, min }) => (label
      ? `${label}: escolha ao menos ${min}`
      : 'Escolha ao menos ${min}'
    ),
    max: ({ label, max }) => (label
      ? `${label}: escolha no máximo ${max}`
      : 'Escolha no máximo ${max}'
    ),
  },
  date: {
    max: ({ label }) => (label ? `${label} está muito no futuro` : 'Essa data é muito no futuro'),
    min: ({ label }) => (label ? `${label} está muito no passado` : 'Essa data é muito no passado'),
    required: ({ label }) => (label ? `${label} não é opcional` : 'Data obrigatória'),
  },
  mixed: {
    default: 'Valor de ${label} não é válido',
    oneOf: 'Opção inválida para ${label}',
    notType: ({ label }) => (label ? `Valor de ${label} inválido` : 'Valor inválido'),
    required: ({ label }) => (label ? `${label} não é opcional` : 'Campo obrigatório'),
  },
  number: {
    integer: ({ label }) => (label ? `${label} deve ser um número inteiro` : 'Deve ser um número inteiro'),
    max: ({ label, max }) => (label ? `${label} deve ser no máximo ${max}` : 'Deve ser no máximo ${max}'),
    min: ({ label, min }) => (label ? `${label} deve ser no mínimo ${min}` : 'Deve ser no mínimo ${min}'),
    positive: ({ label }) => (label ? `${label} deve ser maior do que zero` : 'Deve ser maior do que zero'),
  },
  string: {
    email: ({ label }) => (label ? `${label} não é e-mail válido` : 'E-mail inválido'),
    min: ({ label, min }) => (label
      ? `${label} está menor que ${min} caracteres`
      : 'Esse texto é menor que ${min} caracteres'),
    matches: ({ label }) => (label ? `${label} está fora do formato` : 'Formato inválido'),
    max: ({ label, max }) => (label
      ? `${label} está maior que ${max} caracteres`
      : 'Esse texto é maior que ${max} caracteres'),
    required: ({ label }) => (label ? `${label} não é opcional` : 'Campo obrigatório'),
  },
};
