import operacoesDeResponsabilidade from '@/consts/operacoesDeResponsabilidade';

import {
  array,
  mixed,
  number,
  object,
} from './initSchema';

export default object()
  .shape({
    metas: array()
      .label('Metas')
      .of(number())
      .min(1, 'Selecione ao menos uma meta')
      .required('Selecione ao menos uma meta'),
    operacao: mixed()
      .label('Operação')
      .oneOf(Object.keys(operacoesDeResponsabilidade), 'Escolha uma operação')
      .required('Escolha uma operação'),
    nova_pessoa_id: number()
      .label('Pessoa de destino')
      .nullable()
      .transform((v) => (!v ? null : v))
      .when('operacao', (operacao: keyof typeof operacoesDeResponsabilidade, field) => (
        operacoesDeResponsabilidade[operacao]?.exigeDestino
          ? field.required('Escolha a pessoa de destino')
          : field
      )),
  });
