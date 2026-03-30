import { ApiProperty, PickType } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { Transform, Expose, TransformFnParams } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';
import { NumberTransform } from '../../../auth/transforms/number.transform';

export class CreateRelProjetosDto extends PickType(FilterProjetoDto, ['projeto_id']) {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @Expose()
    orgao_responsavel_id?: number;

    @IsOptional()
    @IsString()
    @Expose()
    codigo?: string;

    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsEnum(ProjetoStatus, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
    })
    @Expose()
    status?: ProjetoStatus;

    @IsNumber() // n pode ser opcional enquanto n remover o exception do join do port compartilhado
    @Transform(NumberTransform)
    @Expose()
    portfolio_id: number;
}
