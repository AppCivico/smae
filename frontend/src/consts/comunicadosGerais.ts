/* eslint-disable import/prefer-default-export */
import {
  date,
  object,
  string,
} from 'yup';

export const comunidadosGeraisFiltrosSchema = object({}).shape({
  palavra_chave: string().label('palavra-chave'),
  data_inicio: date().label('Início do período'),
  data_fim: date().label('Fim do período'),
});
