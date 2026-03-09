import { IsInt } from 'class-validator';

export class CreateRefreshMetaOrcamentoConsolidadoDto {
    @IsInt()
    meta_id: number;
}
