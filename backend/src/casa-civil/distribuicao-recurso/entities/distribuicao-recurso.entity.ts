import { ApiProperty } from '@nestjs/swagger';
import { DistribuicaoStatusTipo, ParlamentarCargo } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ParlamentarIdNomes } from 'src/parlamentar/entities/parlamentar.entity';
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
    objeto: string;
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
    empenho: boolean | null;
    @IsDateYMD({ nullable: true })
    data_empenho: string | null;
    programa_orcamentario_estadual: string | null;
    programa_orcamentario_municipal: string | null;
    dotacoes: string[];
    proposta: string | null;
    contrato: string | null;
    convenio: string | null;
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
    pode_editar: boolean;
    pode_solicitar_ajuste: boolean;
    pode_ver_hist_status: boolean;
    possui_solicitacao_ajuste_pendente: boolean;
}

export class DistribuicaoRecursoTransferenciaDto {
    id: number;
    identificador: string;
    valor: Decimal | null;
}

export class ParlamentarDistribuicaoDto {
    id?: number;
    parlamentar_id: number;
    parlamentar: ParlamentarIdNomes;
    partido_id: number | null;
    partido: IdSigla | null;
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    cargo: ParlamentarCargo | null;
    objeto: string | null;
    valor: Decimal | null;
}

export class DistribuicaoExtratoExecucaoOrcamentariaDto {
    /// id do orçamento realizado
    id: number;
    ano_referencia: number;
    dotacao: string;
    dotacao_complemento: string | null;
    processo: string | null;
    nota_empenho: string | null;
    /// soma do empenho no ano (string com 2 casas decimais)
    soma_valor_empenho: string;
    /// soma da liquidação no ano (string com 2 casas decimais)
    soma_valor_liquidado: string;
    /// último mês (1-12) com valores informados ("Atualizado em")
    mes_atualizado: number;
}

export class DistribuicaoRecursoDetailDto extends DistribuicaoRecursoDto {
    @ApiProperty({ type: [DistribuicaoExtratoExecucaoOrcamentariaDto] })
    extrato_execucao_orcamentaria: DistribuicaoExtratoExecucaoOrcamentariaDto[];
}

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
