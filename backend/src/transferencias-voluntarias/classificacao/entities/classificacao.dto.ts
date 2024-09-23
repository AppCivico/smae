import { CreateClassificacaoDto } from '../dto/create-classificacao.dto';

export class ClassificacaoDto extends CreateClassificacaoDto{
    id: number;
}
export class ListClassificacaoDto {
    linhas: ClassificacaoDto[];
}
