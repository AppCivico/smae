import {
  dataMax,
  dataMin,
} from './config/datas';
import {
  array, boolean, date, number, object, string,
} from './initSchema';

export default object({
  data_criacao: date()
    .label('Data de criação')
    .nullable()
    .max(dataMax)
    .min(dataMin)
    .transform((v) => (!v ? null : v)),
  descricao: string()
    .label('Descrição')
    .min(0)
    .max(2040)
    .required(),
  grupo_portfolio: array()
    .label('Grupos de observadores')
    .nullable()
    .of(
      number()
        .label('Pessoa')
        .required(),
    ),
  icone_impressao: string()
    .label('Ícone para impressão')
    .nullable(),
  nivel_maximo_tarefa: number()
    .label('Nível máximo de aninhamento de tarefas')
    .min(1)
    .max(32)
    .required(),
  modelo_clonagem: boolean()
    .label('Modelo de clonagem')
    .meta({
      balaoInformativo: 'Portfólios modelo servem unicamente para se criar modelos de cronograma que podem ser clonados para outros portfólios.',
    })
    .nullable(),
  nivel_regionalizacao: number()
    .label('Nível de regionalização')
    .min(1)
    .max(4)
    .required(),
  orcamento_execucao_disponivel_meses: array()
    .label('Meses disponíveis para orçamento')
    .min(1, 'Selecione ao menos um mês')
    .required(),
  orgaos: array()
    .label('Órgãos')
    .min(1, 'Selecione ao menos um órgão')
    .required(),
  titulo: string()
    .label('Nome')
    .required('Um portfólio requer um título'),
});
