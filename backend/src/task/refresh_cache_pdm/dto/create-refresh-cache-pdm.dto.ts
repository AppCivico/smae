import { IsBoolean, IsOptional } from 'class-validator';

export class CreateRefreshCachePdmDto {
    // pessoa_acesso_pdm e pessoa_acesso_pdm_valido
    @IsOptional()
    @IsBoolean()
    acesso?: boolean;

    // status_meta_ciclo_fisico
    @IsOptional()
    @IsBoolean()
    status_meta?: boolean;
}
