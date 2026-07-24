import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FonteRelatorio } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { RelatorioModeloConfigDto } from '../../post-process/dto/relatorio-modelo.dto';
import { VISIBILIDADE_TIPOS, VisibilidadeTipo } from '../../relatorios/helpers/visibilidade-templates';

export class CreateRelatorioModeloDto {
    /** Nome do modelo. Precisa ser único entre os modelos ativos da mesma fonte. */
    @IsString({ message: 'nome precisa ser uma string' })
    @MaxLength(250, { message: 'nome deve ter no máximo 250 caracteres' })
    nome: string;

    @IsOptional()
    @IsString({ message: 'descricao precisa ser uma string' })
    @MaxLength(1000, { message: 'descricao deve ter no máximo 1000 caracteres' })
    descricao?: string;

    /** Fonte do relatório que este modelo customiza. Não pode ser alterada depois. */
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: 'fonte precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte: FonteRelatorio;

    /**
     * Escopo de visibilidade, com a mesma semântica do relatório: `publico` (todos que listam a
     * fonte), `privado` (só o criador) ou `meu_orgao` (pessoas do órgão do criador).
     * Default: `privado`.
     */
    @IsOptional()
    @ApiPropertyOptional({ enum: VISIBILIDADE_TIPOS, enumName: 'VisibilidadeTipo' })
    @IsIn(VISIBILIDADE_TIPOS, {
        message: 'visibilidade_tipo precisa ser um dos seguintes valores: ' + VISIBILIDADE_TIPOS.join(', '),
    })
    visibilidade_tipo?: VisibilidadeTipo;

    /**
     * Seleção/ordem/renomeação de colunas, filtros e ordenação. Cada coluna referenciada precisa
     * existir no schema declarado da fonte (ver `GET /relatorio-modelo/colunas`).
     */
    @ValidateNested()
    @Type(() => RelatorioModeloConfigDto)
    config: RelatorioModeloConfigDto;
}
