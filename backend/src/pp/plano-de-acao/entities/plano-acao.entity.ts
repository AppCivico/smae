import { IdSigla } from 'src/common/dto/IdSigla.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';

export class PlanoAcao {
    id: number;
    contramedida: string;
    @IsDateYMD({ nullable: true })
    prazo_contramedida: string | null;
    custo: number | null;
    custo_percentual: number | null;
    medidas_de_contingencia: string;
    responsavel: string | null;
    orgao: IdSigla | null;
    contato_do_responsavel: string | null;
    @IsDateYMD({ nullable: true })
    data_termino: string | null;
    projeto_risco: RiscoIdCod;
}

export class RiscoIdCod {
    id: number;
    codigo: number;
}

export class ListPlanoAcaoDto {
    linhas: PlanoAcao[];
}

export class PlanoAcaoDetailDto {
    id: number;
    contramedida: string;
    @IsDateYMD({ nullable: true })
    prazo_contramedida: string | null;
    custo: number | null;
    custo_percentual: number | null;
    medidas_de_contingencia: string;
    responsavel: string | null;
    orgao: IdSigla | null;
    contato_do_responsavel: string | null;
    @IsDateYMD({ nullable: true })
    data_termino: string | null;
}
