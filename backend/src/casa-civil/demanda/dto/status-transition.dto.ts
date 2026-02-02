import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class DevolverDemandaDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(MAX_LENGTH_MEDIO)
    motivo: string;
}

export class CancelarDemandaDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(MAX_LENGTH_MEDIO)
    motivo: string;
}
