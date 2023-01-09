import {
  array, boolean, number, object, string,
} from 'yup';
import regEx from '@/consts/patterns';

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

export { relatórioMensal, relatórioOrçamentário, relatórioSemestralOuAnual };
