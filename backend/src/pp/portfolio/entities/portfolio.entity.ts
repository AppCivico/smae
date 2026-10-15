import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { IdSiglaDescricao } from '../../../common/dto/IdSigla.dto';
import { IdTituloDto } from '../../../common/dto/IdTitulo.dto';

export class PortfolioIconeDto {
    id: number;
    download_token: string;
    thumbnail_download_token: string | null;
}

export class PortfolioDto {
    id: number;
    titulo: string;
    nivel_maximo_tarefa: number;
    nivel_regionalizacao: number;
    modelo_clonagem: boolean;
    orgaos: IdSiglaDescricao[];
    pode_editar: boolean;
    icone_impressao: PortfolioIconeDto | null;
    /**
     * IDs dos portfólios com os quais os projetos/obras criados neste portfólio são compartilhados por padrão.
     * Só os que ainda valem (ativos, não-modelo e com órgão em comum); vazio se este for modelo de clonagem
     */
    portfolios_compartilhados_padrao: number[];
    /**
     * Os mesmos de `portfolios_compartilhados_padrao`, com título
     */
    compartilhamentos_padrao: IdTituloDto[];
}

export class PortfolioOneDto {
    id: number;
    titulo: string;
    nivel_maximo_tarefa: number;
    nivel_regionalizacao: number;
    orgaos: number[];
    descricao: string;
    @IsDateYMD({ nullable: true })
    data_criacao: string | null;
    orcamento_execucao_disponivel_meses: number[];
    grupo_portfolio: number[];
    modelo_clonagem: boolean;
    icone_impressao: PortfolioIconeDto | null;
    /**
     * IDs dos portfólios com os quais os projetos/obras criados neste portfólio são compartilhados automaticamente
     */
    portfolios_compartilhados_padrao: number[];
}

export class ListPortfolioDto {
    linhas: PortfolioDto[];
}
