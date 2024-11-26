import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo, ParlamentarCargo } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ParlamnetarIdNomes } from 'src/parlamentar/entities/parlamentar.entity';
import { SeiIntegracaoDto } from '../../../sei-integracao/entities/sei-entidade.entity';
import { IsBoolean, IsString, MaxLength } from 'class-validator';

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
    empenho: Boolean | null;
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
    pct_valor_transferencia: number;
    parlamentares: ParlamentarDistribuicaoDto[];
}

export class ParlamentarDistribuicaoDto {
    id?: number;
    parlamentar_id: number;
    parlamentar: ParlamnetarIdNomes;
    partido_id: number | null;
    partido: IdSigla | null;
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    cargo: ParlamentarCargo | null;
    objeto: string | null;
    valor: Decimal | null;
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
    integracao_sei: SeiIntegracaoDto | null;
    lido: boolean;
}

export class SeiLidoStatusDto {
    @IsString()
    @MaxLength(20)
    processo_sei: string;

    @IsBoolean()
    lido: boolean;
}

export class DistribuicaoHistoricoStatusDto {
    id: number;
    data_troca: Date;
    dias_no_status: number;
    motivo: string;
    orgao_responsavel: IdSigla | null;
    status_customizado: StatusDistListDto | null;
    status_base: StatusDistListDto | null;
}

export class StatusDistListDto {
    id: number;
    nome: string;
    @ApiProperty({ enum: DistribuicaoStatusTipo, enumName: 'DistribuicaoStatusTipo' })
    tipo: DistribuicaoStatusTipo;
    status_base: boolean;
}

export class ListDistribuicaoStatusHistoricoDto {
    linhas: DistribuicaoHistoricoStatusDto[];
}
