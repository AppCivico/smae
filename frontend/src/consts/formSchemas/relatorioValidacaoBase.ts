import {
  boolean,
  object,
  string,
} from './initSchema';

export default object()
  .shape({
    eh_publico: boolean()
      .label('Relatório Público')
      .nullable()
      .when('visibilidade_tipo', {
        is: undefined,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    visibilidade_tipo: string()
      .label('Visibilidade')
      .nullable()
      .optional(),
    fonte: string()
      .required(),
  });
