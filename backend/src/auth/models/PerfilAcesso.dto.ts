import { PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, MaxLength } from 'class-validator';

export class CreatePerfilAcessoDto {
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(512, { message: '$property| sigla: Máximo 512 caracteres' })
    nome: string;

    @IsArray()
    @IsInt({ each: true })
    @ArrayMinSize(0)
    @ArrayMaxSize(1000)
    privilegios: number[];
}

export class UpdatePerfilAcessoDto extends PartialType(CreatePerfilAcessoDto) {}

export class PerfilAcessoSimplesDto {
    id: number;
    nome: string;
    autogerenciavel: boolean;
    privilegios: number[];
}

export class ListaPerfilAcessoDto {
    linhas: PerfilAcessoSimplesDto[];
}
