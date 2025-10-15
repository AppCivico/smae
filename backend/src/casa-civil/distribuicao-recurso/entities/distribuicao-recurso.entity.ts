import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo, ParlamentarCargo } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ParlamnetarIdNomes } from 'src/parlamentar/entities/parlamentar.entity';
import { SeiIntegracaoDto } from '../../../sei-integracao/entities/sei-entidade.entity';
import { IsBoolean, IsString, MaxLength } from 'class-validator';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { PaginatedWithPagesDto } from 'src/common/dto/paginated.dto';

export class DistribuicaoRecursoDto {
    id: number;
    nome: string | null;
    transferencia_id: number;
    transferencia: DistribuicaoRecursoTransferenciaDto;
    orgao_gestor: IdSiglaDescricao;
    objeto: String;
    valor: Decimal;
    valor_total: Decimal;
    valor_contrapartida: Decimal;
    valor_empenho: Decimal | null;
    valor_liquidado: Decimal;
    rubrica_de_receita: string | null;
    finalidade: string | null;
    gestor_contrato: string | null;
    custeio: Decimal;
    pct_custeio: Decimal | null;
    investimento: Decimal;
    pct_investimento: Decimal | null;
    empenho: Boolean | null;
    @IsDateYMD({ nullable: true })
    data_empenho: string | null;
    programa_orcamentario_estadual: String | null;
    programa_orcamentario_municipal: String | null;
    dotacao: String | null;
    proposta: String | null;
    contrato: String | null;
    convenio: String | null;
    @IsDateYMD({ nullable: true })
    assinatura_termo_aceite: string | null;
    @IsDateYMD({ nullable: true })
    assinatura_municipio: string | null;
    @IsDateYMD({ nullable: true })
    assinatura_estado: string | null;
    @IsDateYMD({ nullable: true })
    vigencia: string | null;

    aditamentos: AditamentosDto[];
    @IsDateYMD({ nullable: true })
    conclusao_suspensiva: string | null;
    registros_sei: DistribuicaoRecursoSeiDto[] | null;
    pode_registrar_status: boolean;
    historico_status: DistribuicaoHistoricoStatusDto[];
    status_atual?: string;
    pct_valor_transferencia: number;
    parlamentares?: ParlamentarDistribuicaoDto[];
    distribuicao_agencia: string | null;
    distribuicao_conta: string | null;
    distribuicao_banco: string | null;
}

export class DistribuicaoRecursoTransferenciaDto {
    id: number;
    identificador: string;
    valor: Decimal | null;
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

export class DistribuicaoRecursoDetailDto extends DistribuicaoRecursoDto {}

export class AditamentosDto {
    @IsDateYMD()
    data_vigencia: string;
    @IsDateYMD()
    data_vigencia_corrente: string;
    justificativa: string;
}

export class ListDistribuicaoRecursoDto extends PaginatedWithPagesDto<DistribuicaoRecursoDto> {}

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
    @IsDateYMD()
    data_troca: string;
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
