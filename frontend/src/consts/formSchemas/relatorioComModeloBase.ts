import {
  number,
  object,
} from './initSchema';
import relatorioValidacaoBase from './relatorioValidacaoBase';

export default relatorioValidacaoBase.concat(object({
  modelo_id: number()
    .label('Modelo')
    .nullable()
    .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
}));
