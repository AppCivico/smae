import { ApiProperty } from '@nestjs/swagger';
import { StatusContrato } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ContratoAditivoItemDto } from 'src/pp/contrato-aditivo/entities/contrato-aditivo.entity';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class ContratoDetailDto {
    id: number;
    /**
     * projeto_id de contexto: a obra/projeto pela qual o contrato está sendo visualizado.
     * Um contrato compartilhado pode pertencer a vários projetos; este é sempre o da rota.
     */
    projeto_id: number;
    modalidade_contratacao: IdNomeDto | null;
    orgao: IdSiglaDescricao | null;
    fontes_recurso: ContratoFonteRecursoDto[];
    aditivos: ContratoAditivoItemDto[];
    numero: string;
    contrato_exclusivo: boolean;
    @ApiProperty({ enum: StatusContrato, enumName: 'StatusContrato' })
    status: StatusContrato;
    processos_sei: string[] | null;
    objeto_resumo: string | null;
    objeto_detalhado: string | null;
    contratante: string | null;
    empresa_contratada: string | null;
    cnpj_contratada: string | null;
    observacoes: string | null;

    @IsDateYMD({ nullable: true })
    data_assinatura: string | null;
    @IsDateYMD({ nullable: true })
    data_inicio: string | null;
    @IsDateYMD({ nullable: true })
    data_termino: string | null;

    prazo_numero: number | null;
    prazo_unidade: string | null;
    data_base_mes: number | null;
    data_base_ano: number | null;
    valor: Decimal | null;
    total_aditivos: Decimal;
    total_reajustes: Decimal;
    valor_reajustado: Decimal | null;
}

export class ContratoItemDto {
    id: number;
    /** projeto_id de contexto (obra/projeto da rota). Mantido para o front operar por projeto. */
    projeto_id: number;
    numero: string;
    contrato_exclusivo: boolean;
    @ApiProperty({ enum: StatusContrato, enumName: 'StatusContrato' })
    status: StatusContrato;
    objeto_resumo: string | null;
    data_termino_inicial: Date | null;
    data_termino_atual: Date | null;
    valor: Decimal | null;
    processos_sei: string[] | null;
    quantidade_aditivos: number;
    quantidade_reajustes: number;
    total_aditivos: Decimal;
    total_reajustes: Decimal;
    valor_reajustado: Decimal | null;
}

export class ListContratoDto {
    linhas: ContratoItemDto[];
}

export class ContratoCompartilhadoDisponivelDto {
    id: number;
    numero: string;
    contrato_exclusivo: boolean;
    @ApiProperty({ enum: StatusContrato, enumName: 'StatusContrato' })
    status: StatusContrato;
    objeto_resumo: string | null;
    empresa_contratada: string | null;
    valor: Decimal | null;
}

export class ListContratoCompartilhadoDisponivelDto {
    linhas: ContratoCompartilhadoDisponivelDto[];
}

export class ContratoFonteRecursoDto {
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
}
