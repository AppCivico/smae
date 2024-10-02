import { TransferenciaTipoDto } from '../../../casa-civil/transferencia/tipo/entities/transferencia-tipo.dto';
import { IdNomeDto } from '../../../common/dto/IdNome.dto';

export class ClassificacaoDto extends IdNomeDto {
    transferencia_tipo: TransferenciaTipoDto;
}

export class ListClassificacaoDto {
    linhas: ClassificacaoDto[];
}
