import { TipoPdm } from '@prisma/client';
import { PdmSimplesComTipoDto } from './pdm-simples-com-tipo.dto';

export class FormulaCompostaReferenciandoItemDto {
    id: number;
    titulo: string;
    tipo_pdm: TipoPdm;
    autogerenciavel: boolean;
    pdm?: PdmSimplesComTipoDto | null;
}
