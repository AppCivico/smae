import { PartialType } from '@nestjs/swagger';
import { CreateEleicaoDto } from './create-eleicao.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEleicaoDto extends PartialType(CreateEleicaoDto) {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) =>
        value === '' || value === null || value === undefined
            ? undefined
            : typeof value === 'string'
              ? value.toLowerCase() === 'true'
              : value
    )
    atual_para_mandatos?: boolean;
}
