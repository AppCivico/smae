import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { DateYMD } from '../../common/date2ymd';
import { CicloFisicoDto } from '../../pdm/dto/list-pdm.dto';

export class ListPdmCicloDto {
    linhas: CicloFisicoDto[];
}

export class CicloFisicoV2Dto {
    id: number;
    @IsDateYMD()
    data_ciclo: DateYMD;
    @IsDateYMD()
    inicio_coleta: DateYMD;
    @IsDateYMD()
    inicio_qualificacao: DateYMD;
    @IsDateYMD()
    inicio_analise_risco: DateYMD;
    @IsDateYMD()
    inicio_fechamento: DateYMD;
    @IsDateYMD()
    fechamento: DateYMD;
    pode_editar: boolean;
    ativo: boolean;
}

export class ListPdmCicloV2Dto {
    linhas: CicloFisicoV2Dto[];
}
