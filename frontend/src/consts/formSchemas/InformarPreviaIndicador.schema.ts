/* eslint-disable import/prefer-default-export */
import {
  object, array, number,
} from './initSchema';

export const ValorPrevioCategoricaSchema = object({
  valor_previo: array()
    .of(
      object()
        .shape({
          qualificacao: number().label('qualificação'),
          quantidade: number().label('quantidade').nullableOuVazio(),
        }),
    ),
});

export const ValorPrevioCategoricaRegionalizadaSchema = object({
  qualificacao: number().label('Informar').required(),
});

export const ValorPrevioNumericaSchema = object({
  valor: number().label('valor').nullableOuVazio(),
});
