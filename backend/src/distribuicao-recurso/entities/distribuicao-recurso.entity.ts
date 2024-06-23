import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';

export class DistribuicaoRecursoDto {
    id: number;
    nome: string | null;
    transferencia_id: number;
    orgao_gestor: IdSiglaDescricao;
    objeto: String;
    valor: Decimal;
    valor_total: Decimal;
    valor_contrapartida: Decimal;
    custeio: Decimal;
    investimento: Decimal;
    empenho: Boolean;
    data_empenho: Date | null;
    programa_orcamentario_estadual: String | null;
    programa_orcamentario_municipal: String | null;
    dotacao: String | null;
    proposta: String | null;
    contrato: String | null;
    convenio: String | null;
    assinatura_termo_aceite: Date | null;
    assinatura_municipio: Date | null;
    assinatura_estado: Date | null;
    vigencia: Date | null;
    aditamentos: AditamentosDto[];
    conclusao_suspensiva: Date | null;
    registros_sei: DistribuicaoRecursoSeiDto[] | null;
    pode_registrar_status: boolean;
    historico_status: DistribuicaoHistoricoStatusDto[];
}

export class DistribuicaoRecursoDetailDto extends DistribuicaoRecursoDto {
    pode_registrar_status: boolean;
    historico_status: DistribuicaoHistoricoStatusDto[];
}

export class AditamentosDto {
    data_vigencia: Date;
    data_vigencia_corrente: Date;
    justificativa: string;
}

export class ListDistribuicaoRecursoDto {
    linhas: DistribuicaoRecursoDto[];
}

export class DistribuicaoRecursoSeiDto {
    id: number;
    nome: string | null;
    processo_sei: string;
}

export class DistribuicaoHistoricoStatusDto {
    id: number;
    data_troca: Date;
    dias_no_status: number;
    motivo: string;
    orgao_responsavel: IdSigla;
    status: StatusDistListDto | null;
    status_base: StatusDistListDto | null;
}

export class StatusDistListDto {
    id: number;
    nome: string;
    @ApiProperty({ enum: DistribuicaoStatusTipo, enumName: 'DistribuicaoStatusTipo' })
    tipo: DistribuicaoStatusTipo;
    status_base: boolean;
}
