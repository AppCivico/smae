import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class DotacaoBuscaDto {
    @ApiProperty({ example: '30.10.08.60', description: 'Dotação ou parte dela' })
    @IsString()
    query!: string;

    @ApiProperty({ required: false, example: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(1000)
    limit?: number;

    @ApiProperty({ required: false, example: true, default: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined; // preserve default
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return Boolean(value);
    })
    @IsBoolean()
    somenteAtivos?: boolean = true;

    @ApiProperty({ required: false, example: 2024, description: 'Ano da dotação' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    ano?: number;
}

export type ProjetoObraResumoDto = {
    id: number;
    orcamento_realizado_id: number | null;
    nome: string | null;
    codigo: string | null;
    portfolio_id: number | null;
    portfolio_titulo: string | null;
    orgao_responsavel_sigla: string | null;
    status: string | null;

    subprefeitura_nomes: string | null;

    grupo_tematico_nome: string | null;
    tipo_obra_nome: string | null;
    equipamento_nome: string | null;

    dotacoes_encontradas: string[];

    nro_vinculos?: number;
};

export type PdmPsResumoDto = {
    orcamento_realizado_id: number | null;
    pdm_id: number | null;
    pdm_nome: string | null;
    meta_id: number | null;
    meta_codigo: string | null;
    meta_titulo: string | null;
    orgaos_sigla: string[];

    rotulo_iniciativa?: string | null;
    rotulo_atividade?: string | null;

    iniciativa?: { id: number; codigo: string | null; titulo: string | null; nro_vinculos?: number } | null;
    atividade?: { id: number; codigo: string | null; titulo: string | null; nro_vinculos?: number } | null;

    dotacoes_encontradas: string[];

    nro_vinculos?: number;
};

export class DotacaoBuscaResponseDto {
    projetos: ProjetoObraResumoDto[] = [];
    obras: ProjetoObraResumoDto[] = [];
    pdm_ps: PdmPsResumoDto[] = [];
}
