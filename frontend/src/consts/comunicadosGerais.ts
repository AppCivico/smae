/* eslint-disable import/prefer-default-export */
import {
  date,
  object,
  string,
  ref,
} from 'yup';

export const comunidadosGeraisFiltrosSchema = object().shape({
  palavra_chave: string().label('palavra-chave'),
  data_inicio: date()
    .label('Início do período')
    .max(
      ref('data_fim'),
      'A data de início não pode ser posterior à data de fim',
    )
    .test('is-before', 'A data de início deve ser no máximo um dia antes da data de fim', function (value) {
      const dataFim = this.resolve(ref('data_fim'));
      if (!dataFim || !value) return true;
      return new Date(value) <= new Date(new Date(dataFim).setDate(dataFim.getDate() - 1));
    }),
  data_fim: date()
    .label('Fim do período')
    .min(
      ref('data_inicio'),
      'A data de fim não pode ser anterior à data de início',
    ),
});
