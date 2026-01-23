import { ArquivoBaseDto } from 'src/upload/dto/create-upload.dto';

export class DemandaConfigAnexoDto {
    id: number;
    arquivo: ArquivoBaseDto;
}

export class DemandaConfigDto {
    id: number;
    data_inicio_vigencia: string; // YYYY-MM-DD format
    data_fim_vigencia: string | null; // YYYY-MM-DD format
    valor_minimo: string;
    valor_maximo: string;
    bloqueio_valor_min: boolean;
    bloqueio_valor_max: boolean;
    alerta_valor_min: boolean;
    alerta_valor_max: boolean;
    observacao: string | null;
    ativo: boolean | null;
    anexos: DemandaConfigAnexoDto[];
}

export class DemandaConfigDetailDto extends DemandaConfigDto {}

export class ListDemandaConfigDto {
    linhas: DemandaConfigDto[];
}
