import { OmitType, PartialType } from '@nestjs/swagger';

export class Regiao {
    id: number;
    codigo: number | null;
    descricao: string;
    nivel: number;
    parente_id: number | null;
    parente?: RegiaoPai;
    pdm_codigo_sufixo: string | null;
}

export class RegiaoPai extends PartialType(OmitType(Regiao, ['parente_id', 'parente'])) {}

// região sem o parent, mas com o parent_id
export class RegiaoBasica extends OmitType(Regiao, ['parente']) {}
