import esferasDeTransferencia from '@/consts/esferasDeTransferencia';

import {
  mixed,
  number,
  object,
  ref,
} from './initSchema';
import relatorioComModeloBase from './relatorioComModeloBase';

export default relatorioComModeloBase.concat(object({
  parametros: object({
    ano_fim: number()
      .label('Ano até')
      .integer()
      .min(ref('ano_inicio'), 'O ano final não pode ser anterior ao inicial')
      .required(),
    ano_inicio: number()
      .label('Ano de')
      .integer()
      .min(2003, 'A partir de 2003')
      .required(),
    esfera: mixed()
      .label('Esfera')
      .nullable()
      .oneOf([...Object.keys(esferasDeTransferencia), null]),
    tipo_id: number()
      .label('Tipo')
      .nullableOuVazio(),
  }),
}));
