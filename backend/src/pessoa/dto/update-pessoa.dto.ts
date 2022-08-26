import { ApiHideProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';
import { CreatePessoaDto } from './create-pessoa.dto';

export class UpdatePessoaDto extends PartialType(CreatePessoaDto) {
    @ApiHideProperty()
    id?: number

    /**
    * Inativar pessoa
    */
    @IsOptional()
    @IsBoolean({ message: '$property| true para desativar, false para ativar novamente. Nulo não faz nenhuma ação' })
    desativado?: boolean;

    /**
       * Motivo para desativação
    */
    @IsOptional()
    @IsString({ message: '$property| Motivo: Precisa ser alfanumérico' })
    @MinLength(4, { message: '$property| Motivo: Mínimo de 4 caracteres' })
    @MaxLength(250, { message: '$property| Motivo: Máximo 250 caracteres' })
    desativado_motivo?: string;
}
