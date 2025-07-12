import { IndicadorTipo } from '@prisma/client';
import { PdmSimplesComTipoDto } from './pdm-simples-com-tipo.dto';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';

export class IndicadorReferenciandoItemDto {
    id: number;
    codigo: string;
    titulo: string;
    tipo_indicador: IndicadorTipo;
    pdm?: PdmSimplesComTipoDto | null;
    meta?: IdCodTituloDto | null;
    iniciativa?: IdCodTituloDto | null;
    atividade?: IdCodTituloDto | null;
}
