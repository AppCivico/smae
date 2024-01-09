import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';

export class PlanoAcaoMonitoramentoDto {
    id: number;
    plano_acao_id: number;
    data_afericao: Date;
    descricao: string;
    criado_em: Date;
    criador: IdNomeExibicaoDto;
    ultima_revisao: boolean;
}

export class ListPlanoAcaoMonitoramentoDto {
    linhas: PlanoAcaoMonitoramentoDto[];
}
