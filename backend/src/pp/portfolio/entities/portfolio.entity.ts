import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { IdSiglaDescricao } from '../../../common/dto/IdSigla.dto';

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
}

export class ListPortfolioDto {
    linhas: PortfolioDto[];
}
