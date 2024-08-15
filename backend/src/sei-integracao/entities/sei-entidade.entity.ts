import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';

export class SeiUsuarioDto {
    nome: string;
    rf: string;
}
export class SeiUnidadeDto {
    id_unidade: string;
    sigla: string;
    descricao: string;
    tipo_unidade: string;
}

export class SeiProcessadoDto {
    ultimo_andamento_por: SeiUsuarioDto;
    ultimo_andamento_em: Date | null;
    ultimo_andamento_unidade: SeiUnidadeDto;
}

export class SeiIntegracaoDto {
    id: number;
    processo_sei: string;
    ativo: boolean;
    link: string;

    relatorio_sincronizado_em: Date | null;
    resumo_sincronizado_em: Date | null;

    sei_atualizado_em: Date | null;
    resumo_atualizado_em: Date | null;

    status_code: number | null;
    resumo_status_code: number | null;

    @ApiProperty({ description: 'Resultado do relatório já processado, para uso no SMAE' })
    processado: SeiProcessadoDto | null;

    @ApiProperty({ description: 'Resposta do RAW da ultima sincronização do relatório' })
    json_resposta?: any;

    @ApiProperty({
        description:
            'Resumo do json de resposta do RAW da ultima sincronização do resumo, pode ser usada para exibir informações no front-end',
    })
    resumo_json_resposta?: any;
}

//7610.2019/0001393-8
//export const CONST_PROC_SEI_REGEXP = /^\d{4}\.?\d{4}\/?\d{7}-?\d$/;
export const CONST_PROC_SEI_MESSAGE = 'Processo não está no formato esperado: DDDD.DDDD/DDDDDDD-D (SEI)';

export class FilterSeiParams {
    @IsString()
    //@Matches(/^\d{4}\.?\d{4}\/?\d{7}-?\d$/, { message: CONST_PROC_SEI_MESSAGE })
    processo_sei: string;
}

export class FilterSeiListParams {
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    relatorio_sincronizado_de?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    relatorio_sincronizado_ate?: Date;

    @IsOptional()
    @IsString()
    token_proxima_pagina?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Max(1000)
    @Min(1)
    ipp?: number = 25;
}

export class AtivarDesativarSeiDto {
    @IsString({ each: true })
    processos_sei: string[];

    @IsBoolean()
    ativo: boolean;
}
