import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FonteRelatorio } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { RelatorioModeloConfigDto } from '../../post-process/dto/relatorio-modelo.dto';
import { VISIBILIDADE_TIPOS, VisibilidadeTipo } from '../../relatorios/helpers/visibilidade-templates';

export class CreateRelatorioModeloDto {
    /**
     * Nome do modelo. Precisa ser único entre os modelos ativos da mesma fonte.
     *
     * O trim é aplicado antes da validação para que `"  "` seja rejeitado e para que o índice
     * único parcial `(nome, fonte)` não trate `"x"` e `"x "` como nomes distintos.
     */
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'nome precisa ser uma string' })
    @IsNotEmpty({ message: 'nome não pode ser vazio' })
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
    // `@ValidateNested` é ignorado para undefined/null, então sem o `@IsObject` um POST sem
    // `config` passaria a validação e estouraria em `validaConfig` (500) em vez de devolver 400.
    @IsObject({ message: 'config é obrigatório e precisa ser um objeto' })
    @ValidateNested()
    @Type(() => RelatorioModeloConfigDto)
    config: RelatorioModeloConfigDto;
}
