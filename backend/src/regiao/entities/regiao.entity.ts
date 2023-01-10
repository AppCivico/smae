import { OmitType, PartialType } from '@nestjs/swagger';

export class Regiao {
    id: number
    codigo: number | null
    descricao: string
    nivel: number
    parente_id: number | null
    parente?: RegiaoPai
}

export class RegiaoPai extends PartialType(OmitType(Regiao, ['parente_id', 'parente'])) { }
