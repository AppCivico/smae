import { CreateClassificacaoDto } from '../dto/create-classificacao.dto';
import { IsNumber } from 'class-validator';
import { TransferenciaTipoDto } from '../../../casa-civil/transferencia/tipo/entities/transferencia-tipo.dto';

export class ClassificacaoDto extends CreateClassificacaoDto{
    @IsNumber()
    id: number;
    transferencia_tipo: TransferenciaTipoDto;
}
export class ListClassificacaoDto {
    linhas: ClassificacaoDto[];
}
