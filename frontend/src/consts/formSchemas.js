import regEx from '@/consts/patterns';
import {
  array, boolean, number, object, string,
} from 'yup';

const custeio = object().shape({
  custo_previsto: string().required('Preencha o investimento.'),
  parte_dotacao: string().required('Preencha a dotação.').matches(regEx.dotação, 'Formato inválido'),
});

const indicador = object().shape({
  codigo: string().required('Preencha o código'),
  titulo: string().required('Preencha o título'),
  polaridade: string().required('Selecione a polaridade'),
  periodicidade: string().required('Selecione a periodicidade'),
  casas_decimais: string().nullable(),

  inicio_medicao: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
  fim_medicao: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),

  regionalizavel: string().nullable(),
  nivel_regionalizacao: string().nullable().when('regionalizavel', (regionalizavel, field) => (regionalizavel == '1' ? field.required('Selecione o nível') : field)),

  contexto: string().nullable(),
  complemento: string().nullable(),
});

const relatórioMensal = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    mes: number().min(1).max(12).required('Escolha um mês'),
    ano: number().min(2003, 'A partir de 2003').required('Escolha um ano válido'),
    tags: array().nullable(),
    paineis: array().nullable(),
    tipo: string().required('Escolha o tipo'),
  }),
});

const relatórioOrçamentário = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    inicio: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    fim: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    tipo: string().required('Escolha o tipo'),
  }),
});

const relatórioSemestralOuAnual = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    ano: number().min(2003, 'A partir de 2003').required('Escolha um ano válido'),
    semestre: string()
      .when('periodo', {
        is: 'Semestral',
        then: (schema) => schema.required('Escolha o semestre'),
      })
      .matches(regEx['^(:?Primeiro|Segundo)$'], 'Valor inválido'),
    periodo: string().required('Escolha o período').matches(regEx['^(:?Anual|Semestral)$'], 'Valor inválido'),
    tipo: string().required('Escolha o tipo'),
  }),
});

export {
  custeio,
  indicador,
  relatórioMensal,
  relatórioOrçamentário,
  relatórioSemestralOuAnual,
};
