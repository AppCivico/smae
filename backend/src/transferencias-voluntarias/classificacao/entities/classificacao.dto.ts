import { CreateClassificacaoDto } from '../dto/create-classificacao.dto';
import { IsNumber } from 'class-validator';

export class ClassificacaoDto extends CreateClassificacaoDto{
    @IsNumber()
    id: number;
}
export class ListClassificacaoDto {
    linhas: ClassificacaoDto[];
}
