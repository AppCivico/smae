import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, ValidateIf } from 'class-validator';
import { CreatePdmDto } from './create-pdm.dto';

export class UpdatePdmDto extends PartialType(OmitType(CreatePdmDto, ['tipo'])) {
    /**
     * use true para manter ativo, false para desativar. nulo/faltando não faz nenhuma ação
     */
    @IsOptional()
    @IsBoolean({ message: '$property| valor inválido' })
    @ValidateIf((object, value) => value !== null)
    ativo?: boolean | null;
}
