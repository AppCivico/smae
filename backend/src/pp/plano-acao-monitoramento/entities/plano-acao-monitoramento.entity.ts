import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';

export class PlanoAcaoMonitoramentoDto {
    id: number;
    plano_acao_id: number;
    @IsDateYMD()
    data_afericao: string;
    descricao: string;
    criado_em: Date;
    criador: IdNomeExibicaoDto;
    ultima_revisao: boolean;
}

export class ListPlanoAcaoMonitoramentoDto {
    linhas: PlanoAcaoMonitoramentoDto[];
}
