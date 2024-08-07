import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo, TransferenciaInterface, TransferenciaTipoEsfera } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ParlamnetarIdNomes } from 'src/parlamentar/entities/parlamentar.entity';
import { ArquivoBaseDto } from '../../../upload/dto/create-upload.dto';

export class TransferenciaDto {
    id: number;
    ano: number | null;
    identificador: string;
    valor: Decimal | null;
    partido: IdSigla[] | null;
    tipo: IdNomeDto | null;
    objeto: string;
    detalhamento: string | null;
    clausula_suspensiva: boolean | null;
    clausula_suspensiva_vencimento: Date | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;
    pendente_preenchimento_valores: boolean;
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    esfera: TransferenciaTipoEsfera;
    orgao_concedente: IdSiglaDescricao;
    secretaria_concedente: string | null;
    andamento_etapa: string | null;
    andamento_fase: string | null;
    fase_status: string | null;
}

export class ListTransferenciaDto {
    linhas: TransferenciaDto[];
}

export class TransferenciaDetailDto {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string;
    detalhamento: string | null;
    clausula_suspensiva: boolean | null;
    clausula_suspensiva_vencimento: Date | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;
    empenho: boolean | null;
    pendente_preenchimento_valores: boolean;
    valor: Decimal | null;
    valor_total: Decimal | null;
    valor_contrapartida: Decimal | null;
    custeio: Decimal | null;
    investimento: Decimal | null;
    emenda: string | null;
    dotacao: string | null;
    demanda: string | null;
    banco_fim: string | null;
    conta_fim: string | null;
    agencia_fim: string | null;
    banco_aceite: string | null;
    conta_aceite: string | null;
    nome_programa: string | null;
    agencia_aceite: string | null;
    emenda_unitaria: string | null;
    gestor_contrato: string | null;
    ordenador_despesa: string | null;
    numero_identificacao: string | null;
    tipo: IdNomeDto | null;

    workflow_id: number | null;

    parlamentares: ParlamentarTransferenciaDto[];
    orgao_concedente: IdSiglaDescricao;
    secretaria_concedente: string | null;

    @ApiProperty({ enum: TransferenciaInterface, enumName: 'TransferenciaInterface' })
    interface: TransferenciaInterface | null;

    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    esfera: TransferenciaTipoEsfera;

    bloco_nota_token: string;
}

export class ParlamentarTransferenciaDto {
    id: number;
    parlamentar_id: number;
    parlamentar: ParlamnetarIdNomes;
    partido_id: number | null;
    partido: IdSigla | null;
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    cargo: ParlamentarCargo | null;
    objeto: string | null;
    valor: Decimal | null;
}

export class TransferenciaAnexoDto {
    arquivo: ArquivoBaseDto;
    id: number;
    descricao: string | null;
    data: Date | null;
}

export class ListTransferenciaAnexoDto {
    linhas: TransferenciaAnexoDto[];
}
