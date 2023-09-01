import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';

export class CreateRelProjetosDto extends OmitType(PartialType(FilterProjetoDto), [
    'eh_prioritario',
    'arquivado',
    'status',
]) {
    @IsOptional()
    @IsString()
    codigo?: string;

    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
    })
    status?: ProjetoStatus;
}
