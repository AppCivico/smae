import { GeolocalizacaoDto } from '../../geo-loc/entities/geo-loc.entity';

export class Etapa {
    id: number;
    cronograma_id: number;
    etapa_pai_id: number | null;
    regiao_id: number | null;
    endereco_obrigatorio: boolean;
    titulo: string | null;
    descricao: string | null;
    nivel: string | null;
    inicio_previsto: Date | null;
    termino_previsto: Date | null;
    inicio_real: Date | null;
    termino_real: Date | null;
    prazo_inicio: Date | null;
    prazo_termino: Date | null;
    etapa_filha: any | null;
    peso: number | null;
    percentual_execucao: number | null;
    ordem: number | null;
    n_filhos_imediatos: number | null;
    geolocalizacao: GeolocalizacaoDto[];
}
