import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PositiveNumberTransform } from '../../auth/transforms/number.transform';
import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';
import { ApiProperty } from '@nestjs/swagger';

export class BuscaResponsabilidades {
    @IsInt()
    @Transform(PositiveNumberTransform)
    pessoa_id: number;

    @IsOptional()
    @IsInt()
    @Transform(PositiveNumberTransform)
    pdm_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(PositiveNumberTransform)
    orgao_id?: number;
}

export const TransferenciaRespOperacao = {
    transferir: 'transferir',
    copiar: 'copiar',
    remover: 'remover',
} as const;
export type TransferenciaRespOperacao = (typeof TransferenciaRespOperacao)[keyof typeof TransferenciaRespOperacao];

export class ExecutaTransferenciaResponsabilidades {
    @IsInt()
    @Transform(PositiveNumberTransform)
    origem_pessoa_id: number;

    @IsInt()
    @Transform(PositiveNumberTransform)
    nova_pessoa_id: number | null;

    @ApiProperty({ enum: TransferenciaRespOperacao, enumName: 'TransferenciaRespOperacao' })
    @IsEnum(TransferenciaRespOperacao, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaRespOperacao).join(', '),
    })
    operacao: TransferenciaRespOperacao;

    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    metas: number[];
}

export class DetalheResponsabilidadeDto {
    metas: IdCodTituloDto[];
}
