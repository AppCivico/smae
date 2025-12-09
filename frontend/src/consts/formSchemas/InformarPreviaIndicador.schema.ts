/* eslint-disable import/prefer-default-export */
import {
  object, array, string, number,
} from './initSchema';

export const ValorPrevioCategoricaSchema = object({
  valor_previo: array()
    .of(
      object()
        .shape({
          qualificacao: string().label('qualificação'),
          quantidade: number().label('quantidade'),
        }),
    ),
});
