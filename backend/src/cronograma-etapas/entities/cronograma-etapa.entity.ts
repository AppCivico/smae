import { GeolocalizacaoDto } from '../../geo-loc/entities/geo-loc.entity';
import { CreatePSEquipePontoFocalDto } from '../../pdm/dto/create-pdm.dto';

export enum CronogramaEtapaAtrasoGrau {
    Concluido,
    Neutro,
    Moderado,
    Alto,
}
export class Meta {
    id: number;
    titulo: string;
    codigo: string;
}

export class Iniciativa {
    id: number;
    titulo: string;
    codigo: string;
    meta: Meta;
}

export class Atividade {
    id: number;
    titulo: string;
    codigo: string;
    iniciativa: Iniciativa;
}

export class CronogramaWithParents {
    id: number;
    meta_id: number | null;
    iniciativa_id: number | null;
    atividade_id: number | null;
    descricao: string | null;

    meta?: Meta | null;
    iniciativa?: Iniciativa | null;
    atividade?: Atividade | null;
}

export class CECronogramaEtapaDto {
    id: number;
    cronograma_id: number;
    etapa_id: number;
    ordem: number;
    inativo: boolean;
    atraso: number | null;
    atraso_grau: string | null;

    etapa: CEEtapaDto | null;
    cronograma_origem_etapa?: CronogramaWithParents;
}

export class CECronogramaEtapaCronoId {
    id: number;
    cronograma_id: number;
    ordem: number;
}

export class EtapaVariavelItemDto {
    id: number;
    codigo: string;
    titulo: string;
}

export class CEEtapaDto {
    id: number;
    etapa_id: number;
    etapa_pai_id: number | null;
    regiao_id: number | null;
    nivel: string | null;
    descricao: string | null;
    inicio_previsto: Date | null;
    termino_previsto: Date | null;
    inicio_real: Date | null;
    termino_real: Date | null;
    prazo_inicio: Date | null;
    prazo_termino: Date | null;
    titulo: string | null;
    duracao: string;
    atraso: number | null;
    atraso_grau: string;
    ordem: number;
    peso: number | null;
    percentual_execucao: number | null;
    n_filhos_imediatos: number | null;
    endereco_obrigatorio: boolean;
    geolocalizacao: GeolocalizacaoDto[];

    responsaveis: CronogramaEtapaResponsavel[] | null;
    etapa_filha?: CEEtapaDto[] | null;
    pode_editar_realizado: boolean;
    pode_editar: boolean;
    CronogramaEtapa: CECronogramaEtapaCronoId[];
    variavel: EtapaVariavelItemDto | null;
    ps_ponto_focal: CreatePSEquipePontoFocalDto;
}

export class CronogramaEtapaResponsavel {
    id: number;
    nome_exibicao: string;
}
