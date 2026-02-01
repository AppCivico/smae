import { IsString } from 'class-validator';

export class DevolverDemandaDto {
    @IsString()
    motivo: string;
}

export class CancelarDemandaDto {
    @IsString()
    motivo: string;
}
