import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ProjetoOrigemTipo } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { ProjetoMetaDetailDto } from '../../pp/projeto/entities/projeto.entity';
import { IdNomeDto } from './IdNome.dto';
import { IdCodTituloDto } from './IdCodTitulo.dto';

export class UpsertOrigemDto {
    @IsOptional()
    @IsInt({ message: '$property| precisa ser inteiro' })
    id?: number;

    /**
     * tipo da origem
     *
     * @example "Outro"
     */
    @ApiProperty({ enum: ProjetoOrigemTipo, enumName: 'ProjetoOrigemTipo' })
    @IsEnum(ProjetoOrigemTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoOrigemTipo).join(', '),
    })
    origem_tipo: ProjetoOrigemTipo;

    /**
     * origem, não é obrigatório se enviar o campo `origem_tipo` com os valores `PdmSistema`.
     *
     * Obrigatório em caso de `PdmAntigo` ou `Outro`
     *
     * Quando enviar como `PdmSistema` também é necessário enviar `meta_id`, `iniciativa_id` ou `atividade_id`
     * @example "foobar"
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, {message: 'O campo "Origem outro" deve ter no máximo 255 caracteres'})
    @ValidateIf((object, value) => value !== null)
    origem_outro?: string | null;

    /**
     * meta_id, se for por meta
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    meta_id?: number | null;

    /**
     * iniciativa_id, se for por iniciativa
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    iniciativa_id?: number | null;

    /**
     * atividade_id, se for por atividade
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    atividade_id?: number | null;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Meta Código" precisa ter no máximo 255 caracteres' })
    meta_codigo?: string | null;
}

export class ResumoOrigensMetasItem {
    id: number | null;
    pdm_id: number | null;

    @MaxLength(255, { message: 'O campo "Código" precisa ter no máximo 255 caracteres' })
    codigo: string;
}

export class ResumoOrigensMetasItemDto {
    metas: ResumoOrigensMetasItem[];
}

export class DetalheOrigensDto {
    id: number;
    origem_tipo: ProjetoOrigemTipo;
    origem_outro: string | null;
    meta: ProjetoMetaDetailDto | null;
    pdm: IdNomeDto | null;
    atividade: IdCodTituloDto | null;
    iniciativa: IdCodTituloDto | null;
    @ApiProperty({ deprecated: true, description: 'Não usar mais. Use apenas tipo de origem_tipo=PdmSistema' })
    meta_codigo: string | null;
}

export class ResumoDetalheOrigensDto {
    @ApiProperty({
        oneOf: [
            { type: 'array', items: { $ref: getSchemaPath(DetalheOrigensDto) } },
            { $ref: getSchemaPath(ResumoOrigensMetasItemDto) },
        ],
    })
    origens_extra: DetalheOrigensDto[] | ResumoOrigensMetasItemDto;
}
