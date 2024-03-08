import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PositiveNumberTransform } from '../../auth/transforms/number.transform';
import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';

export class BuscaResponsabilidades {
    @IsInt()
    @Transform(PositiveNumberTransform)
    pessoa_id: number;

    @IsOptional()
    @IsInt()
    @Transform(PositiveNumberTransform)
    pdm_id?: number;
}

export class DetalheResponsabilidadeDto {
    metas: IdCodTituloDto[];
}
