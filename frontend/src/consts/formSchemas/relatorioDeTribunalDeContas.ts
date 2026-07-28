import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import {
  mixed,
  number,
  object,
} from './initSchema';
import relatorioValidacaoBase from './relatorioValidacaoBase';

export default relatorioValidacaoBase.concat(object({
  modelo_id: number()
    .label('Modelo')
    .nullable()
    .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  parametros: object({
    ano_inicio: number()
      .label('Ano Início')
      .min(2003, 'A partir de 2003')
      .required(),
    ano_fim: number()
      .label('Ano Fim')
      .min(2003, 'A partir de 2003')
      .required(),
    esfera: mixed()
      .label('Esfera')
      .required()
      // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(esferasDeTransferencia), null]),
    tipo_id: mixed()
      .label('Tipo de Transferência')
      .required()
      .nullableOuVazio(),
    // .oneOf([...Object.keys(tiposTransferências), null]),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Geral',
        'Resumido',
      ])
      .required('Escolha o tipo'),
  }),
}));
