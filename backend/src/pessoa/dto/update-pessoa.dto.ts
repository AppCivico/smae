import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreatePessoaDto } from './create-pessoa.dto';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class UpdatePessoaDto extends PartialType(CreatePessoaDto) {
    /**
     * use true para desativar, false para ativar novamente. nulo/faltando não faz nenhuma ação
     */
    @IsOptional()
    @IsBoolean({ message: '$property| valor inválido' })
    desativado?: boolean;

    /**
     * Motivo para desativação
     */
    @IsOptional()
    @IsString({ message: '$property| Motivo: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Motivo: Mínimo de 4 caracteres' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Desativado motivo' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    desativado_motivo?: string;
}
