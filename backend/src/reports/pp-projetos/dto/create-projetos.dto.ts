import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { ProjetoStatus } from 'src/generated/prisma/client';
import { Transform, Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';
import { NumberTransform } from '../../../auth/transforms/number.transform';

export class CreateRelProjetosDto extends PickType(FilterProjetoDto, [
    'orgao_responsavel_id',
    'projeto_id',
]) {
    @IsOptional()
    @IsString()
    @Expose()
    codigo?: string;

    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
    })
    @Expose()
    status?: ProjetoStatus;

    @IsNumber() // n pode ser opcional enquanto n remover o exception do join do port compartilhado
    @Transform(NumberTransform)
    @Expose()
    portfolio_id: number;
}
