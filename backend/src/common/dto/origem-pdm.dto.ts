import { ApiProperty } from "@nestjs/swagger";
import { ProjetoOrigemTipo } from "@prisma/client";
import { Transform, TransformFnParams } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";

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
    @MaxLength(2048)
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
    meta_codigo?: string | null;
}

export class CachedMetasItem {
    id: number | null;
    pdm_id: number | null;
    codigo: string;
}

export class CachedMetasDto {
    metas: CachedMetasItem[];
}
