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

export const ValorPrevioCategoricaRegionalizadaSchema = object({
  qualificacao: number().label('Informar').required(),
});

export const ValorPrevioNumericaSchema = object({
  valor: number().label('valor').required(),
  referencia: string().label('referencia').required(),
});
