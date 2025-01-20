import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class CronogramaDto {
    id: number;
    iniciativa_id: number | null;
    meta_id: number | null;
    atividade_id: number | null;
    percentual_execucao: number | null;

    descricao: string | null;
    observacao: string | null;
    @IsDateYMD({ nullable: true })
    inicio_previsto: string | null;
    @IsDateYMD({ nullable: true })
    termino_previsto: string | null;
    @IsDateYMD({ nullable: true })
    inicio_real: string | null;
    @IsDateYMD({ nullable: true })
    termino_real: string | null;
    regionalizavel: boolean;
    nivel_regionalizacao: number | null;
    atraso_grau: string | null;
}
