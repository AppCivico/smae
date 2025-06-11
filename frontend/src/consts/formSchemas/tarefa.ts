import i18n from '@/consts/formSchemas/config/i18n';
import {
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  ref,
  setLocale,
  string,
} from 'yup';
import {
  dataMax,
  dataMin,
} from './config/datas';

setLocale(i18n);

export default object()
  .shape({
    atualizacao_do_realizado: boolean(),
    custo_estimado: number()
      .label('Previsão de custo')
      .min(0)
      .nullable(),
    custo_real: number()
      .label('Custo real')
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    dependencias: array()
      .label('Dependências')
      .of(
        object()
          .shape({
            dependencia_tarefa_id: number()
              .label('Tarefa relacionada')
              .min(1, 'Campo obrigatório')
              .required(),
            latencia: number()
              .label('Dias de latência')
              .integer()
              .required()
              .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
            tipo: mixed()
              .label('Tipo de relação')
              .required()
              .oneOf(['termina_pro_inicio', 'inicia_pro_inicio', 'inicia_pro_termino', 'termina_pro_termino']),
          }),
      )
      .strict(),
    descricao: string()
      .label('Descrição')
      .min(0)
      .max(2048)
      .nullable(),
    duracao_planejado: number()
      .label('Duração prevista')
      .min(0)
      .nullable(),
    duracao_real: number()
      .label('Duração real')
      .min(0)
      .nullable(),
    eh_marco: boolean()
      .label('Marco do projeto?')
      .nullable(),
    inicio_planejado: date()
      .label('Previsão de início')
      .max(dataMax)
      .min(dataMin)
      .nullable(),
    inicio_real: date()
      .label('Data de início real')
      .max(dataMax)
      .min(dataMin)
      .nullable(),
    nivel: number()
      .min(1)
      .nullable(),
    numero: number()
      .label('Ordem')
      .min(1)
      .when('atualizacao_do_realizado', (atualizacaoDoRealizado, field) => (!atualizacaoDoRealizado
        ? field.required()
        : field.nullable())),
    orgao_id: number()
      .label('Órgão responsável')
      .min(1, 'Selecione um órgão responsável')
      .required('Escolha um órgão responsável pela tarefa'),
    percentual_concluido: number()
      .label('Percentual concluído')
      .min(0)
      .max(100)
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .when('atualizacao_do_realizado', (atualizacaoDoRealizado, field) => (atualizacaoDoRealizado
        ? field.required()
        : field.nullable())),
    recursos: string()
      .label('Responsável pela atividade')
      .min(0)
      .max(2048),
    tarefa: string()
      .label('Tarefa')
      .min(1)
      .max(255)
      .required(),
    tarefa_pai_id: number()
      .label('Tarefa-mãe')
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    termino_planejado: date()
      .label('Previsão de término')
      .max(dataMax)
      .min(ref('inicio_planejado'), 'Precisa ser posterior à data de início')
      .nullable(),
    termino_real: date()
      .label('Data de término real')
      .max(dataMax)
      .min(ref('inicio_real'), 'Precisa ser posterior à data de início')
      .nullable(),
  });
