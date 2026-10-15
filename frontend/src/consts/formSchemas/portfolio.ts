import type { PortfolioDto } from '@back/pp/portfolio/entities/portfolio.entity';
import {
  dataMax,
  dataMin,
} from './config/datas';
import {
  array, boolean, date, number, object, string,
} from './initSchema';

type PortfolioParaCompartilhamento = Pick<PortfolioDto, 'id' | 'titulo' | 'orgaos'>;

function temOrgaoEmComum(portfolio: PortfolioParaCompartilhamento, orgaos: number[] = []) {
  return portfolio.orgaos.some((x) => orgaos.includes(x.id));
}

// opções para o campo `portfolios_compartilhados_padrao`, com as mesmas regras
// validadas no back-end; os já selecionados permanecem na lista para não sumirem
// da tela caso deixem de atender ao filtro — a validação do schema os aponta
export function portfoliosParaCompartilhamento<
  T extends PortfolioParaCompartilhamento & Pick<PortfolioDto, 'modelo_clonagem'>,
>(
  portfolios: T[],
  {
    portfolioId,
    orgaos = [],
    selecionados = [],
  }: {
    portfolioId?: number;
    orgaos?: number[];
    selecionados?: number[];
  } = {},
): T[] {
  return portfolios.filter((x) => selecionados.includes(x.id)
    || (x.id !== portfolioId
      && !x.modelo_clonagem
      && temOrgaoEmComum(x, orgaos)));
}

// a lista é lida no momento da validação, e não na criação do schema: um schema
// reativo faria o vee-validate revalidar tudo ao mudar, inclusive campos ainda
// não renderizados — que recebem o erro mesmo sem terem sido tocados
export default ({
  obterPortfolios = () => [],
}: {
  // usada para conferir se os compartilhamentos padrão têm órgão em comum
  obterPortfolios?: () => PortfolioParaCompartilhamento[];
} = {}) => object({
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
  modelo_clonagem: boolean()
    .label('Modelo de clonagem')
    .meta({
      balaoInformativo: 'Portfólios modelo servem unicamente para se criar modelos de cronograma que podem ser clonados para outros portfólios.',
    })
    .nullable(),
  nivel_maximo_tarefa: number()
    .label('Nível máximo de aninhamento de tarefas')
    .min(1)
    .max(32)
    .required(),
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
  portfolios_compartilhados_padrao: array()
    .label('Compartilhar por padrão com')
    .meta({
      balaoInformativo: 'Projetos e obras criados neste portfólio já nascem compartilhados com os portfólios escolhidos. Só são aceitos portfólios com ao menos um órgão em comum e que não sejam modelos de clonagem.',
    })
    .nullable()
    .of(
      number()
        .label('Portfólio')
        .required(),
    )
    .test('orgao-em-comum', (selecionados, { createError, parent }) => {
      const semOrgaoEmComum = obterPortfolios().filter((x) => selecionados?.includes(x.id)
        && !temOrgaoEmComum(x, parent.orgaos));

      return !semOrgaoEmComum.length || createError({
        message: `Sem órgão em comum com este portfólio: ${semOrgaoEmComum.map((x) => x.titulo).join(', ')}`,
      });
    }),
  titulo: string()
    .label('Nome')
    .required('Um portfólio requer um título'),
});
