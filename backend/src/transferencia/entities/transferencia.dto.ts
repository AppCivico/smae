import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';

export class TransferenciaDto {
    id: number;
    ano: number | null;
    objeto: string;
    detalhamento: string | null;
    critico: boolean;
    clausula_suspensiva: boolean;
    clausula_suspensiva_vencimento: Date | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;

    orgao_concedente: IdSiglaDescricao;
    secretaria_concedente: IdSiglaDescricao;
}

export class ListTransferenciaDto {
    linhas: TransferenciaDto[];
}
