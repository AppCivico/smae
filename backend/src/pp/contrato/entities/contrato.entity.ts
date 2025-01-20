import { ApiProperty } from '@nestjs/swagger';
import { StatusContrato } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { ContratoAditivoItemDto } from 'src/pp/contrato-aditivo/entities/contrato-aditivo.entity';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class ContratoDetailDto {
    id: number;
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
}

export class ContratoItemDto {
    id: number;
    numero: string;
    @ApiProperty({ enum: StatusContrato, enumName: 'StatusContrato' })
    status: StatusContrato;
    objeto_resumo: string | null;
    data_termino_inicial: Date | null;
    data_termino_atual: Date | null;
    valor: Decimal | null;
    processos_sei: string[] | null;
    quantidade_aditivos: number;
}

export class ListContratoDto {
    linhas: ContratoItemDto[];
}

export class ContratoFonteRecursoDto {
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
}
