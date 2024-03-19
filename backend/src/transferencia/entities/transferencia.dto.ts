import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo, TransferenciaInterface, TransferenciaTipoEsfera } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ParlamnetarIdNomes } from 'src/parlamentar/entities/parlamentar.entity';
import { TipoDocumentoDto } from 'src/tipo-documento/entities/tipo-documento.entity';

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

export class TransferenciaDetailDto {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string;
    detalhamento: string | null;
    critico: boolean;
    clausula_suspensiva: boolean;
    clausula_suspensiva_vencimento: Date | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;
    empenho: boolean | null;
    pendente_preenchimento_valores: boolean;
    valor: Decimal | null;
    valor_total: Decimal | null;
    valor_contrapartida: Decimal | null;
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

    partido: IdSigla | null;
    parlamentar: ParlamnetarIdNomes | null;
    orgao_concedente: IdSiglaDescricao;
    secretaria_concedente: IdSiglaDescricao;

    @ApiProperty({ enum: TransferenciaInterface, enumName: 'TransferenciaInterface' })
    interface: TransferenciaInterface;

    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    esfera: TransferenciaTipoEsfera;

    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    cargo: ParlamentarCargo | null;
}

export class TransferenciaAnexoDto {
    arquivo: {
        id: number;
        descricao: string | null;
        tamanho_bytes: number;
        nome_original: string;
        download_token?: string;
        diretorio_caminho: string | null;
        data: Date | null;
        TipoDocumento: TipoDocumentoDto | null;
    };
    id: number;
    descricao: string | null;
    data: Date | null;
}

export class ListTransferenciaAnexoDto {
    linhas: TransferenciaAnexoDto[];
}
