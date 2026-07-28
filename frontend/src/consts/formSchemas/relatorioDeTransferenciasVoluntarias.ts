import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import interfacesDeTransferências from '@/consts/interfacesDeTransferências';
import {
  mixed,
  number,
  object,
  string,
} from './initSchema';
import relatorioValidacaoBase from './relatorioValidacaoBase';

export default relatorioValidacaoBase.concat(object({
  modelo_id: number()
    .label('Modelo')
    .nullable()
    .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  parametros: object({
    ano: number()
      .label('Ano')
      .min(2003, 'A partir de 2003')
      .nullable(),
    esfera: mixed()
      .label('Esfera')
      .nullable()
      // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(esferasDeTransferencia), null]),
    gestor_contrato: string()
      .label('Gestor do Contrato')
      .nullable(),
    interface: mixed()
      .label('Interface')
      .nullable()
    // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(interfacesDeTransferências), null])
      .transform((v) => (v === '' ? null : v)),
    objeto: string()
      .label('Objeto/Empreendimento')
      .max(50000)
      .nullable(),
    orgao_gestor_id: number()
      .label('Órgão gestor')
      .nullable(),
    parlamentar_id: number()
      .label('Parlamentar')
      .nullable(),
    orgao_concedente_id: number()
      .label('Órgão concedente')
      .min(1, 'Selecione um órgão responsável')
      .nullable(),
    partido_id: number()
      .label('Partido')
      .min(0, '${label} inválido')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    secretaria_concedente: string()
      .label('Secretaria concedente')
      .max(250)
      .nullable(),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Geral',
        'Resumido',
      ])
      .required('Escolha o tipo'),
  }),
}));
